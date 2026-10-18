import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/loadTypeScript.mjs';
const { createApiSession } = await loadTypeScript(
  new URL('../src/core/session/createApiSession.ts', import.meta.url),
);
async function client(handler) {
  globalThis.fetch = handler;
  const storage = { getItem: () => null, setItem() {}, removeItem() {} };
  return createApiSession('http://test', storage);
}
const tokens = (name) => ({
  accessToken: name,
  refreshToken: 'refresh-' + name,
  accessTokenExpiresAt: '2099-01-01',
});
const ok = (data) => new Response(JSON.stringify({ succeeded: true, data }), { status: 200 });
const unauthorized = () => new Response(JSON.stringify({ succeeded: false }), { status: 401 });
function deferred() {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
}
test('concurrent 401 uses one refresh and rotated bearer', async () => {
  let refreshes = 0;
  const gate = deferred();
  const headers = [];
  const api = await client(async (url, init) => {
    if (url.endsWith('/auth/refresh')) {
      refreshes++;
      await gate.promise;
      return ok(tokens('new'));
    }
    headers.push(init.headers.Authorization);
    return init.headers.Authorization === 'Bearer old' ? unauthorized() : ok('data');
  });
  api.session.set(tokens('old'));
  const a = api.request('/a');
  const b = api.request('/b');
  await new Promise((r) => setImmediate(r));
  gate.resolve();
  assert.deepEqual(await Promise.all([a, b]), ['data', 'data']);
  assert.equal(refreshes, 1);
  assert.equal(headers.filter((x) => x === 'Bearer new').length, 2);
});
test('logout during refresh cannot restore tokens or retry', async () => {
  const gate = deferred();
  let calls = 0;
  const api = await client(async (url) => {
    calls++;
    if (url.endsWith('/auth/refresh')) {
      await gate.promise;
      return ok(tokens('new'));
    }
    return unauthorized();
  });
  api.session.set(tokens('old'));
  const p = api.request('/a');
  await new Promise((r) => setImmediate(r));
  api.session.clear();
  gate.resolve();
  await assert.rejects(p);
  assert.equal(api.session.hasTokens(), false);
  assert.equal(calls, 2);
});
test('old mutation is never replayed after account switch', async () => {
  const gate = deferred();
  let calls = 0;
  const api = await client(async () => {
    calls++;
    if (calls === 1) await gate.promise;
    return ok('done');
  });
  api.session.set(tokens('old'));
  const p = api.request('/review', { method: 'POST', body: '{}' });
  api.session.set(tokens('other'));
  gate.resolve();
  await assert.rejects(p);
  assert.equal(calls, 1);
});
test('second 401 clears session and retries only once', async () => {
  let resourceCalls = 0;
  const api = await client(async (url) =>
    url.endsWith('/auth/refresh') ? ok(tokens('new')) : (resourceCalls++, unauthorized()),
  );
  api.session.set(tokens('old'));
  await assert.rejects(api.request('/a'));
  assert.equal(resourceCalls, 2);
  assert.equal(api.session.hasTokens(), false);
});
test('validation error preserves status and field errors without refresh', async () => {
  let calls = 0;
  const api = await client(async () => {
    calls++;
    return new Response(
      JSON.stringify({
        succeeded: false,
        message: 'Invalid',
        errorCode: 'Validation',
        errors: { note: ['Required'] },
      }),
      { status: 400 },
    );
  });
  api.session.set(tokens('old'));
  await assert.rejects(
    api.request('/review'),
    (e) => e.status === 400 && e.fields.note[0] === 'Required',
  );
  assert.equal(calls, 1);
});
test('refresh failure clears stored session', async () => {
  const api = await client(async () => unauthorized());
  api.session.set(tokens('old'));
  await assert.rejects(api.request('/a'));
  assert.equal(api.session.hasTokens(), false);
});
test('aborted request propagates cancellation without clearing auth', async () => {
  const api = await client(async () => {
    throw new DOMException('Cancelled', 'AbortError');
  });
  api.session.set(tokens('old'));
  await assert.rejects(api.request('/a'), (e) => e.name === 'AbortError');
  assert.equal(api.session.hasTokens(), true);
});
test('successful mutation is not replayed by parallel same-account refresh', async () => {
  const gate = deferred();
  let mutations = 0;
  const api = await client(async (url, init) => {
    if (url.endsWith('/review')) {
      mutations++;
      if (mutations === 1) await gate.promise;
      return ok('saved');
    }
    if (url.endsWith('/auth/refresh')) return ok(tokens('new'));
    return init.headers.Authorization === 'Bearer old' ? unauthorized() : ok('read');
  });
  api.session.set(tokens('old'));
  const mutation = api.request('/review', { method: 'POST', body: '{}' });
  await api.request('/read');
  gate.resolve();
  assert.equal(await mutation, 'saved');
  assert.equal(mutations, 1);
});

test('list and null payloads retain their shape', async () => {
  for (const data of [[{ id: 'one' }], null]) {
    const api = await client(async () => ok(data));
    api.session.set(tokens('old'));
    assert.deepEqual(await api.request('/resource'), data);
  }
});

test('missing data in a successful envelope rejects malformed response', async () => {
  const api = await client(
    async () => new Response(JSON.stringify({ succeeded: true }), { status: 200 }),
  );
  await assert.rejects(
    api.request('/resource', {}, false),
    (error) => error.code === 'INVALID_RESPONSE',
  );
});

test('temporary refresh outage retains session for a later retry', async () => {
  const api = await client(async (url) =>
    url.endsWith('/auth/refresh')
      ? new Response(JSON.stringify({ succeeded: false }), { status: 503 })
      : unauthorized(),
  );
  api.session.set(tokens('old'));
  await assert.rejects(api.request('/resource'));
  assert.equal(api.session.hasTokens(), true);
});

test('forbidden request does not refresh or discard session', async () => {
  let calls = 0;
  const api = await client(async () => {
    calls++;
    return new Response(JSON.stringify({ succeeded: false }), { status: 403 });
  });
  api.session.set(tokens('old'));
  await assert.rejects(api.request('/resource'), (error) => error.status === 403);
  assert.equal(calls, 1);
  assert.equal(api.session.hasTokens(), true);
});

test('absolute URL is rejected before sending credentials', async () => {
  let calls = 0;
  const api = await client(async () => {
    calls++;
    return ok(null);
  });
  api.session.set(tokens('old'));
  await assert.rejects(api.request('https://other.example/resource'));
  assert.equal(calls, 0);
});

test('new account refresh does not join previous account refresh', async () => {
  const entered = deferred();
  const release = deferred();
  let refreshes = 0;
  const api = await client(async (url, init) => {
    if (url.endsWith('/auth/refresh')) {
      refreshes++;
      if (JSON.parse(init.body).refreshToken === 'refresh-old') {
        entered.resolve();
        await release.promise;
        return ok(tokens('old-rotated'));
      }
      return ok(tokens('new-rotated'));
    }
    return init.headers.Authorization === 'Bearer new-rotated' ? ok('new account') : unauthorized();
  });
  api.session.set(tokens('old'));
  const oldRequest = api.request('/resource');
  const oldRejected = assert.rejects(oldRequest);
  await entered.promise;
  api.session.set(tokens('new'));
  assert.equal(await api.request('/resource'), 'new account');
  release.resolve();
  await oldRejected;
  assert.equal(refreshes, 2);
  assert.equal(api.session.hasTokens(), true);
});
