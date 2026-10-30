import assert from 'node:assert/strict';

export async function checkSession({
  send,
  evaluate,
  click,
  fill,
  waitFor,
  newPage,
  selectPage,
  baseUrl,
  checks,
}) {
  const source = (stage) => `
    ${stage === 'initial' ? 'localStorage.clear();sessionStorage.clear();' : ''}
    window.sessionCalls=[];let heldOldMe=false;
    window.fetch=async(input,options={})=>{
      const path=new URL(typeof input==='string'?input:input.url,location.href).pathname;
      window.sessionCalls.push({path,method:options.method||'GET'});
      let status=200,data=null;
      const tokens=name=>({accessToken:name,refreshToken:'fixture-refresh-'+name,accessTokenExpiresAt:'2099-01-01'});
      if(path==='/auth/login')data=tokens(${JSON.stringify(stage)}==='race-peer'?'fixture-peer':'fixture-original');
      else if(path==='/auth/refresh')data=tokens('fixture-rotated');
      else if(path==='/auth/me'){
        if(${JSON.stringify(stage)}==='race-initial'&&options.headers?.Authorization==='Bearer fixture-original'&&!heldOldMe){heldOldMe=true;await new Promise(resolve=>{window.releaseOldMe=resolve;});}
        if(${JSON.stringify(stage)}==='reopened'&&options.headers?.Authorization==='Bearer fixture-original')status=401;
        else data={userId:'fixture-admin',accountId:'fixture-admin',accountGroup:'InternalAdmin',email:'admin@example.invalid',fullName:'Quản trị kiểm thử',emailVerified:true,roles:[],permissions:['organizations.manage']};
      } else if(path==='/organizations/search')data={items:[],totalRecords:0,totalPages:0,pageNumber:1,pageSize:20};
      return new Response(JSON.stringify({succeeded:status===200,data}),{status,headers:{'Content-Type':'application/json'}});
    };
  `;
  const first = await newPage();
  await send('Page.addScriptToEvaluateOnNewDocument', { source: source('initial') });
  await send('Page.navigate', { url: new URL('/login', baseUrl).href });
  await waitFor("!!document.querySelector('#email')");
  await fill('#password', 'Fixture-only-password!');
  await click('button[type=submit]');
  await waitFor(
    "location.pathname==='/admin/organizations'&&!!document.querySelector('.app-layout')",
  );
  const second = await newPage();
  await send('Target.closeTarget', { targetId: first.targetId });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: source('reopened') });
  await send('Page.navigate', { url: new URL('/admin/organizations', baseUrl).href });
  await waitFor("!!document.querySelector('.app-layout')||!!document.querySelector('.login-card')");
  assert.equal(
    await evaluate('location.pathname'),
    '/admin/organizations',
    'Closing a tab and reopening must restore authentication',
  );
  assert.equal(
    await evaluate("window.sessionCalls.filter(call=>call.path==='/auth/refresh').length"),
    1,
    'Expired access refreshes once when reopening',
  );
  await newPage();
  await send('Page.addScriptToEvaluateOnNewDocument', { source: source('peer') });
  await send('Page.navigate', { url: new URL('/admin/organizations', baseUrl).href });
  await waitFor("!!document.querySelector('.app-layout')");
  await click('.logout-button');
  await waitFor("location.pathname==='/login/admin'");
  selectPage(second);
  await waitFor("location.pathname==='/login/admin'");
  const third = await newPage();
  await send('Target.closeTarget', { targetId: second.targetId });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: source('after-logout') });
  await send('Page.navigate', { url: new URL('/admin/organizations', baseUrl).href });
  await waitFor("!!document.querySelector('.login-card')||!!document.querySelector('.app-layout')");
  assert.equal(
    await evaluate('location.pathname'),
    '/login/admin',
    'Logout remains logged out after reopening',
  );
  const raced = await newPage();
  await send('Page.addScriptToEvaluateOnNewDocument', { source: source('race-initial') });
  await send('Page.navigate', { url: new URL('/login', baseUrl).href });
  await waitFor("!!document.querySelector('#email')");
  await fill('#password', 'Fixture-only-password!');
  await click('button[type=submit]');
  await waitFor('!!window.releaseOldMe');
  const replacement = await newPage();
  await send('Page.addScriptToEvaluateOnNewDocument', { source: source('race-peer') });
  await send('Page.navigate', { url: new URL('/admin/organizations', baseUrl).href });
  await waitFor("!!document.querySelector('.app-layout')");
  await click('.logout-button');
  await waitFor("location.pathname==='/login/admin'");
  await fill('#password', 'Fixture-only-password!');
  await click('button[type=submit]');
  await waitFor("!!document.querySelector('.app-layout')");
  selectPage(raced);
  await evaluate('window.releaseOldMe();new Promise(resolve=>setTimeout(resolve,60))');
  assert.equal(
    await evaluate(
      "JSON.parse(localStorage.getItem(Object.keys(localStorage).find(key=>key.startsWith('transconnect.management.session:')))||'null')?.accessToken",
    ),
    'fixture-peer',
    'A stale sign-in hydration must not delete the newer peer login',
  );
  selectPage(replacement);
  assert.equal(await evaluate('location.pathname'), '/admin/organizations');
  await click('.logout-button');
  await waitFor("location.pathname==='/login/admin'");
  checks.push({
    name: 'persistent-session',
    closeReopen: true,
    expiredAccessRefreshed: true,
    logoutCleared: true,
    peerLogoutSynchronized: true,
    staleSignInPreservedPeer: true,
  });
  return third;
}
