import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
const source = await readFile(new URL('../src/lib/api.ts', import.meta.url), 'utf8');
let counter = 0;
async function client(handler) {
  globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  globalThis.fetch = handler;
  const js = stripTypeScriptTypes(source.replace('import.meta.env.VITE_API_BASE_URL', JSON.stringify('http://test')), {mode:'transform'});
  return import('data:text/javascript;base64,' + Buffer.from(js + '\n// instance '+counter++).toString('base64'));
}
const tokens = (name) => ({accessToken:name,refreshToken:'refresh-'+name,accessTokenExpiresAt:'2099-01-01'});
const ok = (data) => new Response(JSON.stringify({succeeded:true,data}),{status:200});
const unauthorized = () => new Response(JSON.stringify({succeeded:false}),{status:401});
function deferred() { let resolve; const promise = new Promise(r=>resolve=r); return {promise,resolve}; }
test('concurrent 401 uses one refresh and rotated bearer', async () => {
  let refreshes=0; const gate=deferred(); const headers=[];
  const api=await client(async (url,init)=>{ if(url.endsWith('/auth/refresh')) {refreshes++; await gate.promise; return ok(tokens('new'));} headers.push(init.headers.Authorization); return init.headers.Authorization==='Bearer old'?unauthorized():ok('data'); });
  api.session.set(tokens('old')); const a=api.request('/a'); const b=api.request('/b');
  await new Promise(r=>setImmediate(r)); gate.resolve(); assert.deepEqual(await Promise.all([a,b]),['data','data']); assert.equal(refreshes,1); assert.equal(headers.filter(x=>x==='Bearer new').length,2);
});
test('logout during refresh cannot restore tokens or retry', async () => {
  const gate=deferred(); let calls=0;
  const api=await client(async url=>{calls++; if(url.endsWith('/auth/refresh')) {await gate.promise; return ok(tokens('new'));} return unauthorized();});
  api.session.set(tokens('old')); const p=api.request('/a'); await new Promise(r=>setImmediate(r)); api.session.clear(); gate.resolve(); await assert.rejects(p); assert.equal(api.session.hasTokens(),false); assert.equal(calls,2);
});
test('old mutation is never replayed after account switch', async () => {
  const gate=deferred(); let calls=0;
  const api=await client(async ()=>{calls++; if(calls===1) await gate.promise; return ok('done');});
  api.session.set(tokens('old')); const p=api.request('/review',{method:'POST',body:'{}'}); api.session.set(tokens('other')); gate.resolve(); await assert.rejects(p); assert.equal(calls,1);
});
test('second 401 clears session and retries only once', async () => {
  let resourceCalls=0;
  const api=await client(async url=>url.endsWith('/auth/refresh')?ok(tokens('new')):(resourceCalls++,unauthorized()));
  api.session.set(tokens('old')); await assert.rejects(api.request('/a')); assert.equal(resourceCalls,2); assert.equal(api.session.hasTokens(),false);
});
test('validation error preserves status and field errors without refresh', async () => {
  let calls=0; const api=await client(async ()=>{calls++; return new Response(JSON.stringify({succeeded:false,message:'Invalid',errorCode:'Validation',errors:{note:['Required']}}),{status:400});});
  api.session.set(tokens('old')); await assert.rejects(api.request('/review'), e=>e.status===400 && e.fields.note[0]==='Required'); assert.equal(calls,1);
});
test('refresh failure clears stored session', async () => {
  const api=await client(async ()=>unauthorized()); api.session.set(tokens('old'));
  await assert.rejects(api.request('/a')); assert.equal(api.session.hasTokens(),false);
});
test('aborted request propagates cancellation without clearing auth', async () => {
  const api=await client(async ()=>{throw new DOMException('Cancelled','AbortError');}); api.session.set(tokens('old'));
  await assert.rejects(api.request('/a'), e=>e.name==='AbortError'); assert.equal(api.session.hasTokens(),true);
});
test('successful mutation is not replayed by parallel same-account refresh', async () => {
  const gate=deferred(); let mutations=0;
  const api=await client(async (url,init)=>{if(url.endsWith('/review')) {mutations++; if(mutations===1) await gate.promise; return ok('saved');} if(url.endsWith('/auth/refresh')) return ok(tokens('new')); return init.headers.Authorization==='Bearer old'?unauthorized():ok('read');});
  api.session.set(tokens('old')); const mutation=api.request('/review',{method:'POST',body:'{}'}); await api.request('/read'); gate.resolve(); assert.equal(await mutation,'saved'); assert.equal(mutations,1);
});
