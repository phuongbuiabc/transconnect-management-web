import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

export async function checkAdmin({
  send,
  evaluate,
  click,
  waitFor,
  output,
  baseline,
  baseUrl,
  checks,
}) {
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
    sessionStorage.setItem('transconnect.admin.session',JSON.stringify({accessToken:'fixture-only',refreshToken:'fixture-only',accessTokenExpiresAt:'2099-01-01'}));
    window.uiFixture={calls:[],empty:false,fail:false};
    window.fetch=async (input,options={})=>{
      const url=new URL(typeof input==='string'?input:input.url,location.href);
      const path=url.pathname;
      const body=options.body?JSON.parse(options.body):{};
      window.uiFixture.calls.push({path,method:options.method||'GET',approved:body.approved,isActive:body.isActive});
      const user={userId:'fixture-admin',accountId:'fixture-admin',accountGroup:'InternalAdmin',fullName:'Nguyễn Minh An',email:'admin@example.invalid',emailVerified:true,roles:['InternalAdmin'],permissions:['organizations.manage','users.manage','locations.manage']};
      const organizations=[
        {id:'org-01',name:'Vận tải Hành Trình Việt',registrationNumber:'0100000001',ownerEmail:'hanhtrinh@example.invalid',reviewStatus:'Pending'},
        {id:'org-02',name:'Nhà xe Nam Phương',registrationNumber:'0300000002',ownerEmail:'namphuong@example.invalid',reviewStatus:'Approved'},
        {id:'org-03',name:'Vận tải Bắc Nam',registrationNumber:'0400000003',ownerEmail:'bacnam@example.invalid',reviewStatus:'Pending'},
        {id:'org-04',name:'Hợp tác xã Vận tải Thành Công',registrationNumber:'0500000004',ownerEmail:'thanhcong@example.invalid',reviewStatus:'Rejected'}
      ];
      const locations=[{id:'loc-01',name:'Điểm đón Bến xe Miền Đông mới',type:'BusStation',datasetId:'fixture',provinceCode:'79',wardCode:'001',addressDetail:'Đường Hoàng Hữu Nam, TP. Hồ Chí Minh',latitude:10.879,longitude:106.814,version:1,isActive:true,accessInstructions:'Cổng đón khách số 1'}];
      const paged=items=>({items:window.uiFixture.empty?[]:items,totalRecords:window.uiFixture.empty?0:items.length,totalPages:window.uiFixture.empty?0:1,pageNumber:1,pageSize:20});
      let data=[];
      if(path==='/auth/me')data=user;
      else if(path==='/organizations/search')data=paged(organizations);
      else if(path==='/organizations/org-01')data={...organizations[0],createdByUserId:'fixture-owner',employeeLimit:10,driverLimit:null};
      else if(path==='/accounts')data=paged([{id:'account-01',fullName:'Trần Hoàng Nam',email:'nam@example.invalid',accountGroup:'Customer',isActive:true}]);
      else if(path==='/drivers/search')data=paged([{id:'driver-01',fullName:'Lê Quốc Huy',reviewStatus:'Pending',contactPhone:'0900000000',contactAddress:'TP. Hồ Chí Minh'}]);
      else if(path==='/locations/admin/shared')data=paged(locations);
      const failed=window.uiFixture.fail && path!=='/auth/me';
      return new Response(JSON.stringify({succeeded:!failed,data:failed?null:data,message:failed?'Không thể tải dữ liệu thử nghiệm.':null}),{status:failed?500:200,headers:{'Content-Type':'application/json'}});
    };
  `,
  });
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Page.navigate', { url: new URL('/admin/organizations', baseUrl).href });
  await waitFor(
    "!!document.querySelector('.sidebar nav a') && !!document.querySelector('table tbody tr')",
  );
  const destinations = ['locations', 'drivers', 'accounts', 'organizations'];
  for (const destination of destinations) {
    await click(`.sidebar nav a[href='/admin/${destination}']`);
    await waitFor(
      `location.pathname==='/admin/${destination}' && document.querySelector('.sidebar nav a[aria-current=page]')?.getAttribute('href')==='/admin/${destination}'`,
    );
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1100, y: 20 });
    await delay(220);
    const selection = await evaluate(`(() => {
      const links=[...document.querySelectorAll('.sidebar nav a')];
      const selected=links.find(a=>a.getAttribute('aria-current')==='page');
      const other=links.find(a=>a!==selected);
      return {count:links.filter(a=>a.getAttribute('aria-current')==='page').length,selected:getComputedStyle(selected).backgroundColor,other:getComputedStyle(other).backgroundColor};
    })()`);
    assert.equal(selection.count, 1, 'Exactly one current sidebar destination');
    assert.notEqual(
      selection.selected,
      selection.other,
      `Selection changes visually on ${destination}`,
    );
    checks.push({ name: 'sidebar-' + destination, ...selection });
    if (!baseline)
      assert.equal(
        selection.selected,
        'rgb(211, 23, 30)',
        'Current destination uses the brand selection colour',
      );
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
    const scrollWidth = await evaluate('document.documentElement.scrollWidth');
    checks.push({ name, width, scrollWidth });
    await writeFile(
      resolve(output, name + '.png'),
      Buffer.from(
        (await send('Page.captureScreenshot', { captureBeyondViewport: true })).data,
        'base64',
      ),
    );
    if (!baseline && scrollWidth > width) {
      const overflow = await evaluate(
        `[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>${width}+1&&!el.closest('.table-scroll')).map(el=>({tag:el.tagName,class:el.className,right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width})).slice(0,15)`,
      );
      assert.fail(
        JSON.stringify({ message: 'Admin viewport overflow', width, scrollWidth, overflow }),
      );
    }
  }
  await capture('admin-organizations-desktop', 1440, 1000);
  await capture('admin-organizations-mobile', 390, 844);
  if (!baseline) {
    assert.ok(
      await evaluate(
        "document.querySelector('.sidebar').inert || getComputedStyle(document.querySelector('.sidebar')).visibility==='hidden'",
      ),
      'Closed mobile sidebar must not remain keyboard focusable',
    );
    await click('.menu-toggle');
    await waitFor("document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='true'");
    await waitFor("document.querySelector('.sidebar').contains(document.activeElement)");
    assert.ok(
      await evaluate("document.querySelector('.sidebar').contains(document.activeElement)"),
      'Opening mobile nav moves focus inside',
    );
    await capture('admin-mobile-menu', 390, 844);
    await evaluate(
      `(() => {const links=[...document.querySelectorAll('.sidebar a,.sidebar button')].filter(el=>getComputedStyle(el).display!=='none');links.at(-1).focus();})()`,
    );
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
    assert.ok(
      await evaluate("document.querySelector('.sidebar').contains(document.activeElement)"),
      'Tab stays inside the mobile navigation',
    );
    await send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'Escape',
      code: 'Escape',
      windowsVirtualKeyCode: 27,
    });
    await send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Escape',
      code: 'Escape',
      windowsVirtualKeyCode: 27,
    });
    await waitFor("document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='false'");
    assert.ok(
      await evaluate("document.activeElement.classList.contains('menu-toggle')"),
      'Escape restores menu trigger focus',
    );
    await click('.menu-toggle');
    await click(".sidebar nav a[href='/admin/locations']");
    await waitFor(
      "location.pathname==='/admin/locations' && document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='false'",
    );
    await capture('admin-locations-mobile', 390, 844);
    await capture('admin-locations-small', 320, 740);
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await waitFor(
      "!document.querySelector('.sidebar').inert && getComputedStyle(document.querySelector('.sidebar')).visibility==='visible'",
    );
    await click(".sidebar nav a[href='/admin/accounts']");
    await waitFor("location.pathname==='/admin/accounts'");
    await capture('admin-accounts-desktop', 1440, 1000);
    await capture('admin-accounts-mobile', 390, 844);
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await waitFor("!document.querySelector('.sidebar').inert");
    assert.ok(
      await evaluate("document.querySelector('td button.button').disabled"),
      'Account lock needs an explicit reason',
    );
    await evaluate(
      `(()=>{const input=document.querySelector('.review-note-field input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Lý do thử nghiệm');input.dispatchEvent(new Event('input',{bubbles:true}));})()`,
    );
    await click('td button.button');
    await waitFor(
      "window.uiFixture.calls.some(call=>call.path==='/accounts/account-01/status' && call.method==='PUT')",
    );
    assert.equal(
      await evaluate("window.uiFixture.calls.find(call=>call.path.endsWith('/status')).isActive"),
      false,
      'Account status retains backend boolean contract',
    );
    await click(".sidebar nav a[href='/admin/drivers']");
    await waitFor("location.pathname==='/admin/drivers'");
    await capture('admin-drivers-desktop', 1440, 1000);
    assert.ok(
      await evaluate("document.querySelector('td button.primary').disabled"),
      'Driver review needs a reason',
    );
    await evaluate(
      `(()=>{const input=document.querySelector('.review-note-field textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(input,'Căn cứ thử nghiệm');input.dispatchEvent(new Event('input',{bubbles:true}));})()`,
    );
    await click('td button.primary');
    await waitFor(
      "window.uiFixture.calls.some(call=>call.path==='/drivers/driver-01/review' && call.method==='POST')",
    );
    assert.equal(
      await evaluate("window.uiFixture.calls.find(call=>call.path.endsWith('/review')).approved"),
      true,
      'Driver review retains backend approval contract',
    );
    await click(".sidebar nav a[href='/admin/locations']");
    await waitFor("location.pathname==='/admin/locations'");
    await capture('admin-locations-desktop', 1440, 1000);
    await click(".sidebar nav a[href='/admin/organizations']");
    await waitFor("!!document.querySelector('a.organization-name')");
    await click('a.organization-name');
    await waitFor(
      "location.pathname==='/admin/organizations/org-01' && !!document.querySelector('.detail-grid')",
    );
    assert.equal(
      await evaluate(
        "document.querySelector('.sidebar nav a[aria-current=page]').getAttribute('href')",
      ),
      '/admin/organizations',
      'Detail keeps parent selection',
    );
    await capture('admin-organization-detail', 1440, 1000);
    assert.equal(
      await evaluate("document.querySelector('.detail-grid>section h2').textContent"),
      'Thông tin đăng ký',
      'Registration leads the detail workflow',
    );
    assert.ok(
      await evaluate(
        "document.querySelector('.review-panel').getBoundingClientRect().top<document.querySelector('.detail-history').getBoundingClientRect().top",
      ),
      'Review controls precede secondary history',
    );
    await capture('admin-organization-detail-mobile', 390, 844);
    assert.ok(
      await evaluate(
        "document.querySelector('.review-panel').compareDocumentPosition(document.querySelector('.detail-history'))&Node.DOCUMENT_POSITION_FOLLOWING",
      ),
      'Mobile reading order keeps review before history',
    );
    await evaluate('history.back()');
    await waitFor(
      "location.pathname==='/admin/organizations' && !!document.querySelector('a.organization-name')",
    );
    await capture('admin-organizations-tablet', 768, 1024);
    await capture('admin-organizations-compact', 1280, 900);
    await evaluate('window.uiFixture.empty=true');
    await click('.page-heading button');
    await waitFor("!!document.querySelector('.state h3')");
    await capture('admin-empty', 1440, 1000);
    await evaluate('window.uiFixture.fail=true');
    await click('.page-heading button');
    await waitFor("!!document.querySelector('.notice.error')");
    assert.equal(
      await evaluate("!!document.querySelector('.state h3')"),
      false,
      'Load failure does not display empty state',
    );
    await capture('admin-error', 1440, 1000);
  }
}
