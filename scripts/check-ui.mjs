import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { checkAdmin } from './check-admin-ui.mjs';
import { checkSession } from './check-session-ui.mjs';

// Dependency-free Chromium fallback until the project's Playwright connection is available.
// All API fetches are replaced before application startup. No real session or DB is used.
let baseUrl = process.env.UI_BASE_URL;
let preview;
const browserPath =
  process.env.UI_BROWSER_PATH ||
  [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
  ].find(existsSync);
assert.ok(
  browserPath && existsSync(browserPath),
  'Set UI_BROWSER_PATH to an installed Chromium browser',
);
const baseline = process.argv.includes('--baseline');
const output = resolve('.ui-artifacts', baseline ? 'before' : 'after');
await mkdir(output, { recursive: true });
if (!baseUrl) {
  const dist = resolve('dist');
  assert.ok(existsSync(resolve(dist, 'index.html')), 'Run npm run build before check:ui');
  const types = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.woff2': 'font/woff2',
    '.ico': 'image/x-icon',
  };
  // Test-only server: ephemeral loopback port, no Vite/HMR or persistent helper process.
  preview = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
      let file = resolve(dist, '.' + pathname);
      if (file !== dist && !file.startsWith(dist + sep)) {
        response.writeHead(403).end();
        return;
      }
      if (!extname(file)) file = resolve(dist, 'index.html');
      const data = await readFile(file);
      response
        .writeHead(200, {
          'Content-Type': types[extname(file)] || 'application/octet-stream',
          'Cache-Control': 'no-store',
        })
        .end(data);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolveListen, reject) => {
    preview.once('error', reject);
    preview.listen(0, '127.0.0.1', resolveListen);
  });
  baseUrl = `http://127.0.0.1:${preview.address().port}`;
}
assert.ok(
  ['127.0.0.1', 'localhost', '[::1]'].includes(new URL(baseUrl).hostname),
  'Local server required',
);
const browser = spawn(
  browserPath,
  [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-pipe',
    `--user-data-dir=${output}/profile-${Date.now()}`,
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ],
  { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] },
);
const pending = new Map();
const errors = [];
const checks = [];
let nextId = 0;
let sessionId;
let buffer = '';
let browserStderr = '';
browser.stderr.on('data', (chunk) => {
  browserStderr = (browserStderr + chunk).slice(-2000);
});
browser.on('error', (error) => {
  for (const request of pending.values()) request.reject(error);
});
browser.on('exit', () => {
  for (const request of pending.values())
    request.reject(new Error('Browser exited: ' + browserStderr));
});
browser.stdio[4].on('data', (chunk) => {
  buffer += chunk.toString();
  let end;
  while ((end = buffer.indexOf('\0')) >= 0) {
    const raw = buffer.slice(0, end);
    buffer = buffer.slice(end + 1);
    if (!raw) continue;
    const message = JSON.parse(raw);
    if (message.id) {
      const request = pending.get(message.id);
      if (!request) continue;
      pending.delete(message.id);
      if (message.error) request.reject(new Error(JSON.stringify(message.error)));
      else request.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') {
      errors.push(message.params.exceptionDetails.text);
    } else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      errors.push(
        message.params.args.map((argument) => argument.value || argument.description).join(' '),
      );
    }
  }
});
function send(method, params = {}) {
  return new Promise((resolveRequest, rejectRequest) => {
    const id = ++nextId;
    const timer = setTimeout(() => {
      pending.delete(id);
      rejectRequest(new Error('Timeout: ' + method + '\n' + browserStderr));
    }, 15000);
    pending.set(id, {
      resolve: (value) => {
        clearTimeout(timer);
        resolveRequest(value);
      },
      reject: (error) => {
        clearTimeout(timer);
        rejectRequest(error);
      },
    });
    browser.stdio[3].write(JSON.stringify({ id, method, params, sessionId }) + '\0');
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function waitFor(expression) {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (await evaluate(expression)) return;
    await delay(100);
  }
  const diagnostic = await evaluate(
    '({url:location.href,body:document.body?.innerText.slice(0,1500),html:document.documentElement?.outerHTML.slice(0,1500)})',
  );
  throw new Error(
    'Condition timed out: ' + expression + '\n' + JSON.stringify({ diagnostic, errors }),
  );
}
async function click(selector) {
  await waitFor(
    `(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el||el.closest('[inert]'))return false;const style=getComputedStyle(el);return style.visibility!=='hidden'&&style.display!=='none';})()`,
  );
  const point = await evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    element.scrollIntoView({block:'center'});
    const rect = element.getBoundingClientRect();
    return {x:rect.x+rect.width/2,y:rect.y+rect.height/2};
  })()`);
  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    button: 'left',
    clickCount: 1,
    ...point,
  });
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    button: 'left',
    clickCount: 1,
    ...point,
  });
}
async function fill(selector, value) {
  await evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(element,${JSON.stringify(value)});
    element.dispatchEvent(new Event('input',{bubbles:true}));
  })()`);
}
async function capture(name, width, height) {
  await evaluate('window.scrollTo(0,0);document.fonts.ready.then(()=>true)');
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
  });
  await delay(150);
  const layout =
    await evaluate(`({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
    title:document.title,heading:document.querySelector('.login-card h1, .login-card h2')?.textContent,
    inputFont:getComputedStyle(document.querySelector('#email')).fontSize})`);
  assert.ok(layout.scrollWidth <= width, `No horizontal overflow at ${width}px`);
  assert.ok(
    await evaluate(
      "document.querySelector('.access-header .brand').getBoundingClientRect().height > 0",
    ),
    `Brand stays visible at ${width}px`,
  );
  checks.push({ name, ...layout });
  const screenshot = await send('Page.captureScreenshot', { captureBeyondViewport: true });
  await writeFile(resolve(output, name + '.png'), Buffer.from(screenshot.data, 'base64'));
}
try {
  const target = await send('Target.createTarget', { url: 'about:blank' });
  sessionId = (await send('Target.attachToTarget', { targetId: target.targetId, flatten: true }))
    .sessionId;
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
    sessionStorage.clear();
    window.uiFixture = {calls:[],hold:false,release:null};
    window.fetch = async (input,options={}) => {
      const path = new URL(typeof input==='string'?input:input.url,location.href).pathname;
      const payload = options.body ? JSON.parse(options.body) : null;
      // Only log account group, never passwords/email/token values.
      window.uiFixture.calls.push({path,method:options.method||'GET',accountGroup:payload?.accountGroup,systemAccountMatches:payload?.email==='admin@hotmail.com'});
      if(window.uiFixture.hold) await new Promise(resolve => {window.uiFixture.release=resolve;});
      return new Response(JSON.stringify({succeeded:false,message:'Kiểm tra lại thông tin đã nhập.',
        errorCode:'VALIDATION_ERROR',errors:{Email:['Email thử nghiệm chưa hợp lệ.']},data:null}),
        {status:400,headers:{'Content-Type':'application/json'}});
    };
  `,
  });
  await send('Page.navigate', { url: new URL('/login', baseUrl).href });
  await waitFor("!!document.querySelector('.login-card form')");
  await capture('login-desktop', 1440, 1000);
  await capture('login-mobile', 390, 844);
  await capture('login-small', 320, 740);
  await capture('login-tablet', 768, 1024);
  assert.equal(await evaluate('location.pathname'), '/login/admin');
  assert.equal(await evaluate("document.querySelector('#email').tagName"), 'SELECT');
  assert.equal(await evaluate("document.querySelector('#email').value"), 'sysadmin');
  assert.equal(
    await evaluate("document.querySelector('label[for=email]').textContent"),
    'Tài khoản',
  );
  assert.deepEqual(
    await evaluate(
      "Array.from(document.querySelector('#email').options, option => option.textContent.trim())",
    ),
    ['Sysadmin', 'Developer', 'Data engineer', 'Accountant'],
    'Account choices show names, never backing emails',
  );
  for (const id of ['developer', 'data-engineer', 'accountant']) {
    await fill('#password', 'Fixture-only-password!');
    await evaluate(
      `(() => { const select = document.querySelector('#email'); select.value = ${JSON.stringify(id)}; select.dispatchEvent(new Event('change', {bubbles:true})); })()`,
    );
    assert.equal(
      await evaluate("document.querySelector('#password').value"),
      '',
      'Account switching clears the password',
    );
    assert.ok(
      await evaluate(
        "document.querySelector('button[type=submit]').disabled && document.querySelector('#password').disabled",
      ),
      'Unconfigured accounts cannot sign in',
    );
    await evaluate(
      "document.querySelector('form').dispatchEvent(new Event('submit', {bubbles:true,cancelable:true}))",
    );
    assert.equal(
      await evaluate('window.uiFixture.calls.length'),
      0,
      'Unconfigured accounts never send an auth request',
    );
    assert.ok(
      await evaluate(
        "document.querySelector('#system-account-status').textContent.includes('chưa được thiết lập')",
      ),
    );
  }
  await capture('admin-account-unavailable-mobile', 390, 844);
  await evaluate(
    "(() => { const select = document.querySelector('#email'); select.value = 'sysadmin'; select.dispatchEvent(new Event('change', {bubbles:true})); })()",
  );
  assert.equal(await evaluate("document.querySelector('button[type=submit]').disabled"), false);
  await click('a[href="/login/partner"]');
  await waitFor(
    "location.pathname==='/login/partner' && document.querySelector('#email')?.tagName==='INPUT'",
  );
  await capture('partner-login-desktop', 1440, 1000);
  await capture('partner-login-mobile', 390, 844);
  await click('.access-register button');
  await capture('registration-mobile', 390, 844);
  if (!baseline) {
    assert.equal(
      await evaluate("document.querySelector('.login-card h1').textContent"),
      'Tạo tài khoản đối tác',
    );
    assert.equal(
      await evaluate("document.querySelector('#password').autocomplete"),
      'new-password',
    );
    await click('button[type=submit]');
    assert.equal(
      await evaluate('window.uiFixture.calls.length'),
      0,
      'Invalid native form does not send a request',
    );
    await fill('#full-name', 'Đối tác kiểm thử');
    await fill('#email', 'fixture@example.invalid');
    await fill('#password', 'Fixture-only-123!');
    await click('.password-toggle');
    assert.equal(await evaluate("document.querySelector('#password').type"), 'text');
    assert.equal(
      await evaluate("document.querySelector('.password-toggle').getAttribute('aria-pressed')"),
      'true',
    );
    await click('.password-toggle');
    await evaluate('window.uiFixture.hold=true');
    await click('button[type=submit]');
    await waitFor('!!window.uiFixture.release');
    assert.ok(
      await evaluate(
        "document.querySelector('form').getAttribute('aria-busy')==='true' && document.querySelector('#full-name').disabled && document.querySelector('.access-portal').getAttribute('aria-disabled')==='true' && document.querySelector('button[type=submit]').disabled",
      ),
      'Busy state locks all account controls',
    );
    const requestCount = await evaluate('window.uiFixture.calls.length');
    await click('button[type=submit]');
    assert.equal(
      await evaluate('window.uiFixture.calls.length'),
      requestCount,
      'Duplicate submit blocked',
    );
    assert.equal(await evaluate('window.uiFixture.calls.at(-1).path'), '/auth/register');
    assert.equal(await evaluate('window.uiFixture.calls.at(-1).accountGroup'), 'Operator');
    await evaluate('window.uiFixture.hold=false;window.uiFixture.release()');
    await waitFor("!!document.querySelector('#login-error')");
    assert.equal(
      await evaluate('document.activeElement.id'),
      'login-error',
      'Failed submit focuses error summary',
    );
    assert.equal(
      await evaluate("document.querySelector('#email').getAttribute('aria-invalid')"),
      'true',
    );
    assert.equal(
      await evaluate("document.querySelector('#email').value"),
      'fixture@example.invalid',
      'Error preserves entered values',
    );
    await capture('registration-error-mobile', 390, 844);
    await click('.access-register button');
    assert.equal(
      await evaluate("!!document.querySelector('#login-error')"),
      false,
      'Changing mode clears obsolete errors',
    );
    assert.equal(
      await evaluate("document.querySelector('#password').autocomplete"),
      'current-password',
    );
    await click('button[type=submit]');
    await waitFor("!!document.querySelector('#login-error')");
    assert.equal(await evaluate('window.uiFixture.calls.at(-1).path'), '/auth/login');
    await send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'Tab',
      code: 'Tab',
      windowsVirtualKeyCode: 9,
    });
    await send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Tab',
      code: 'Tab',
      windowsVirtualKeyCode: 9,
    });
    assert.equal(
      await evaluate("document.activeElement.getAttribute('href')"),
      '#email',
      'Keyboard reaches the invalid field link from the summary',
    );
    await send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'Enter',
      code: 'Enter',
      windowsVirtualKeyCode: 13,
    });
    await send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Enter',
      code: 'Enter',
      windowsVirtualKeyCode: 13,
    });
    assert.equal(
      await evaluate('document.activeElement.id'),
      'email',
      'Summary link focuses invalid field',
    );
    await click('a[href="/login/admin"]');
    await waitFor(
      "location.pathname==='/login/admin' && document.querySelector('#email')?.tagName==='SELECT'",
    );
    assert.equal(
      await evaluate("document.querySelector('#password').value"),
      '',
      'Portal navigation clears credentials',
    );
    assert.equal(await evaluate("document.querySelector('#password').type"), 'password');
    assert.equal(
      await evaluate("!!document.querySelector('input[type=checkbox]')"),
      false,
      'No public admin registration',
    );
    assert.equal(await evaluate('document.title'), 'VieGo · Quản trị');
    await fill('#password', 'Fixture-only-123!');
    await click('button[type=submit]');
    await waitFor("!!document.querySelector('#login-error')");
    assert.equal(await evaluate('window.uiFixture.calls.at(-1).accountGroup'), 'InternalAdmin');
    assert.equal(
      await evaluate('window.uiFixture.calls.at(-1).systemAccountMatches'),
      true,
      'Admin login submits the selected hardcoded account',
    );
    await capture('login-error-desktop', 1440, 1000);
    assert.deepEqual(errors, [], 'No browser exceptions or console errors');
  }
  if (process.argv.includes('--admin')) {
    await checkAdmin({ send, evaluate, click, waitFor, output, baseline, baseUrl, checks });
  }
  if (process.argv.includes('--session')) {
    const newPage = async () => {
      sessionId = undefined;
      const target = await send('Target.createTarget', { url: 'about:blank' });
      sessionId = (
        await send('Target.attachToTarget', { targetId: target.targetId, flatten: true })
      ).sessionId;
      await send('Page.enable');
      await send('Runtime.enable');
      return { targetId: target.targetId, sessionId };
    };
    await checkSession({
      send,
      evaluate,
      click,
      fill,
      waitFor,
      newPage,
      selectPage: (page) => {
        sessionId = page.sessionId;
      },
      baseUrl,
      checks,
    });
  }
  if (!baseline)
    assert.deepEqual(
      errors,
      [],
      'No browser exceptions or console errors across all checked routes',
    );
  await writeFile(
    resolve(output, 'report.json'),
    JSON.stringify(
      {
        engine: 'Installed Chromium via CDP',
        baseline,
        fixtureOnly: true,
        liveApiTested: false,
        physicalDeviceTested: false,
        checks,
        errors,
        requests: await evaluate('window.uiFixture?.calls ?? window.sessionCalls ?? []'),
      },
      null,
      2,
    ),
  );
  console.log(
    `PASS: ${baseline ? 'baseline captures' : 'responsive/auth/keyboard/error regression'}; artifacts: ${output}`,
  );
  await send('Browser.close');
} finally {
  browser.kill();
  preview?.closeAllConnections();
  preview?.close();
  for (const request of pending.values()) request.reject(new Error('Browser check finished'));
  pending.clear();
}
