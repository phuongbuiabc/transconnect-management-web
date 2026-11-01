import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

export async function checkLocations({
  send,
  evaluate,
  click,
  waitFor,
  baseUrl,
  output,
  checks,
  mapNetwork,
}) {
  const liveTiles = process.argv.includes('--live-tiles');
  if (!liveTiles) {
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        // Test-only, deterministic image loading; application code and provider configuration stay intact.
        const descriptor=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
        const tile='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e3e5e8"/><path d="M0 128H256M128 0V256" stroke="#626963"/></svg>');
        Object.defineProperty(HTMLImageElement.prototype,'src',{
          ...descriptor,
          set(value){
            const url=new URL(value,location.href);
            const isTile=/\\/\\d+\\/\\d+\\/\\d+\\.(png|jpg|webp)$/.test(url.pathname);
            descriptor.set.call(this,isTile?(window.locationTileFailure?'data:image/png;base64,broken':tile):value);
          }
        });
      `,
    });
  }
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      window.locationMapErrors=[];
      addEventListener('error', event => {
        if(event.message) window.locationMapErrors.push(event.message);
        else if(event.target?.classList?.contains('leaflet-tile')) {
          const url=new URL(event.target.src);
          window.locationMapErrors.push('Tile failed: '+url.origin+url.pathname);
        }
      },true);
      addEventListener('unhandledrejection',event=>window.locationMapErrors.push(String(event.reason)));
    `,
  });
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Page.navigate', { url: new URL('/admin/locations', baseUrl).href });
  await waitFor("!!document.querySelector('.locations-heading button')");
  await click('.locations-heading button');
  await waitFor("!!document.querySelector('.leaflet-container')");
  await delay(1500);
  const initial = await evaluate(`(() => {
    const map=document.querySelector('.leaflet-container');
    return {
      errors:window.locationMapErrors,
      tiles:map.querySelectorAll('.leaflet-tile').length,
      loaded:map.querySelectorAll('.leaflet-tile-loaded').length,
      dimensions:[...map.querySelectorAll('.leaflet-tile')].slice(0,2).map(el=>({width:el.width,height:el.height,naturalWidth:el.naturalWidth})),
      bounds:{width:map.clientWidth,height:map.clientHeight},
      controls:map.querySelectorAll('.leaflet-control-zoom a').length,
    };
  })()`);
  initial.network = mapNetwork;
  await writeFile(
    resolve(output, 'location-map-diagnostic.json'),
    JSON.stringify(initial, null, 2),
  );
  await writeFile(
    resolve(output, 'location-map-open.png'),
    Buffer.from(
      (await send('Page.captureScreenshot', { captureBeyondViewport: true })).data,
      'base64',
    ),
  );
  assert.deepEqual(initial.errors, [], 'Opening the map must not produce JS or tile errors');
  assert.ok(initial.loaded > 0, 'Map must display loaded tiles');
  assert.ok(
    initial.dimensions.every((t) => t.width === 256 && t.height === 256),
    'Leaflet tiles stay square',
  );
  await click('.place-search input');
  await send('Input.insertText', { text: 'Bến xe kiểm thử' });
  await delay(250);
  assert.equal(
    await evaluate(
      "window.uiFixture.calls.filter(call=>call.path==='/locations/place-search').length",
    ),
    0,
    'Typing does not invoke public geocoding',
  );
  await click('.place-search-controls button');
  await waitFor("!!document.querySelector('.place-search-results button')");
  await click('.place-search-results button');
  const selected = await evaluate(
    `({name:document.querySelector('input[name=name]').value, coordinates:[...document.querySelectorAll('.locations-form-map input[type=number]')].map(input=>input.value), confirmed:!!document.querySelector('.locations-confirmed'), province:document.querySelector('select[name=provinceCode]').value})`,
  );
  assert.equal(selected.name, 'Bến xe kiểm thử');
  assert.deepEqual(selected.coordinates, ['10.8791234', '106.8145678']);
  assert.equal(selected.confirmed, false, 'A searched point still requires explicit confirmation');
  assert.equal(selected.province, '', 'Search does not guess administrative units');
  await delay(400);
  await click('.leaflet-container');
  await waitFor("!!document.querySelector('.leaflet-marker-icon')");
  await delay(350);
  const coordinates = await evaluate(
    `Array.from(document.querySelectorAll('.locations-form-map input[type=number]')).map(el=>el.value)`,
  );
  assert.ok(
    coordinates.every((value) => value !== '' && Number.isFinite(Number(value))),
    'Picking a map point fills both coordinates',
  );
  const marker = await evaluate(`(() => {
    const el=document.querySelector('.leaflet-marker-icon');
    el.scrollIntoView({block:'center'});
    const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};
  })()`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...marker });
  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    button: 'left',
    buttons: 1,
    clickCount: 1,
    ...marker,
  });
  for (let step = 1; step <= 5; step++) {
    await send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      button: 'left',
      buttons: 1,
      x: marker.x + step * 10,
      y: marker.y - step * 4,
    });
    await delay(20);
  }
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    button: 'left',
    buttons: 0,
    clickCount: 1,
    x: marker.x + 50,
    y: marker.y - 20,
  });
  await delay(350);
  const dragged = await evaluate(
    `Array.from(document.querySelectorAll('.locations-form-map input[type=number]')).map(el=>el.value)`,
  );
  assert.notDeepEqual(dragged, coordinates, 'Dragging the pin updates the form coordinates');
  await click('.leaflet-control-zoom-in');
  await delay(350);
  assert.deepEqual(await evaluate('window.locationMapErrors'), [], 'Zooming remains error free');
  if (!liveTiles) {
    const beforeFailure = await evaluate(
      `Array.from(document.querySelectorAll('.locations-form-map input[type=number]')).map(el=>el.value)`,
    );
    await evaluate('window.locationTileFailure=true');
    await click('.leaflet-control-zoom-in');
    await waitFor(
      "!!document.querySelector('.locations-form-map [role=status]') && window.locationMapErrors.length>0",
    );
    assert.ok(
      await evaluate(
        "[...document.querySelectorAll('.locations-form-map button')].some(el=>el.textContent.includes('Thử tải lại bản đồ'))",
      ),
      'A failed tile load must offer a retry without closing or resetting the location form',
    );
    await writeFile(
      resolve(output, 'location-map-error.png'),
      Buffer.from(
        (await send('Page.captureScreenshot', { captureBeyondViewport: true })).data,
        'base64',
      ),
    );
    await evaluate('window.locationTileFailure=false;window.locationMapErrors=[]');
    await click('.location-map-retry');
    await waitFor(
      "document.querySelectorAll('.leaflet-tile-loaded').length>0 && !document.querySelector('.location-map-retry')",
    );
    assert.deepEqual(
      await evaluate(
        `Array.from(document.querySelectorAll('.locations-form-map input[type=number]')).map(el=>el.value)`,
      ),
      beforeFailure,
      'Retry preserves the chosen coordinates',
    );
  }
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await delay(350);
  assert.ok(
    await evaluate('document.documentElement.scrollWidth<=innerWidth'),
    'Location form fits a phone',
  );
  await writeFile(
    resolve(output, 'location-map-mobile.png'),
    Buffer.from(
      (await send('Page.captureScreenshot', { captureBeyondViewport: true })).data,
      'base64',
    ),
  );
  await click('.locations-form-actions .secondary');
  await waitFor("!document.querySelector('.leaflet-container')");
  await click('.locations-heading button');
  await waitFor("document.querySelectorAll('.leaflet-container').length===1");
  await delay(500);
  assert.deepEqual(
    await evaluate('window.locationMapErrors'),
    [],
    'Closing and reopening the map stays error free',
  );
  checks.push({
    name: 'location-map-open-pick-drag-zoom-reopen',
    liveTiles,
    ...initial,
    coordinatesPresent: true,
    dragChangesCoordinates: true,
    tileRecoveryTested: !liveTiles,
  });
}
