import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/loadTypeScript.mjs';
const { createApiSession } = await loadTypeScript(
  new URL('../src/core/session/createApiSession.ts', import.meta.url),
);
const { createBrowserPersistence, LEGACY_SESSION_KEY } = await loadTypeScript(
  new URL('../src/core/session/browserPersistence.ts', import.meta.url),
);
const tokens = (name) => ({
  accessToken: name,
  refreshToken: 'refresh-' + name,
  accessTokenExpiresAt: '2099-01-01',
});
const ok = (data) => new Response(JSON.stringify({ succeeded: true, data }), { status: 200 });
const denied = () => new Response(JSON.stringify({ succeeded: false }), { status: 401 });
function store() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}
function environment(local = store(), session = store(), url = 'http://api.test') {
  const browser = createBrowserPersistence(url, { localStorage: local, sessionStorage: session });
  return {
    browser,
    local,
    session,
    client: createApiSession(url, browser.storage, { syncStorage: true }),
  };
}
function gate() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test('persistent session survives a new client and logout removes durable credentials', async () => {
  const first = environment();
  first.client.session.set(tokens('retained'));
  const second = environment(first.local);
  globalThis.fetch = async (_url, init) => {
    assert.equal(init.headers.Authorization, 'Bearer retained');
    return ok('restored');
  };
  assert.equal(await second.client.request('/auth/me'), 'restored');
  globalThis.fetch = async () => ok(null);
  await second.client.logout();
  assert.equal(environment(first.local).client.session.hasTokens(), false);
});
test('legacy tab storage migrates once without resurrecting after logout', () => {
  const local = store(),
    legacy = store();
  legacy.setItem(LEGACY_SESSION_KEY, JSON.stringify(tokens('legacy')));
  const state = environment(local, legacy);
  assert.equal(state.client.session.hasTokens(), true);
  assert.equal(legacy.getItem(LEGACY_SESSION_KEY), null);
  assert.ok(local.getItem(state.browser.key));
  state.client.session.clear();
  assert.equal(environment(local, legacy).client.session.hasTokens(), false);
});
test('persistent storage is isolated by API environment', () => {
  const one = environment();
  one.client.session.set(tokens('one'));
  const two = environment(one.local, store(), 'http://other-api.test');
  assert.equal(two.client.session.hasTokens(), false);
});
test('unavailable storage retains a usable memory session without claiming durability', () => {
  const blocked = {
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
    removeItem() {
      throw new Error('blocked');
    },
  };
  const state = environment(blocked, blocked);
  state.client.session.set(tokens('memory'));
  assert.equal(state.browser.durable, false);
  state.client.session.sync();
  assert.equal(state.client.session.hasTokens(), true);
  state.client.session.clear();
  assert.equal(state.client.session.hasTokens(), false);
});
test('cross-tab rotation uses one refresh under the shared refresh lock', async () => {
  const local = store();
  let tail = Promise.resolve(),
    refreshes = 0;
  const lock = (work) => {
    const result = tail.then(work);
    tail = result.catch(() => {});
    return result;
  };
  const aStore = createBrowserPersistence('http://api.test', {
    localStorage: local,
    sessionStorage: store(),
  });
  const a = createApiSession('http://api.test', aStore.storage, {
    syncStorage: true,
    withRefreshLock: lock,
  });
  a.session.set(tokens('old'));
  const bStore = createBrowserPersistence('http://api.test', {
    localStorage: local,
    sessionStorage: store(),
  });
  const b = createApiSession('http://api.test', bStore.storage, {
    syncStorage: true,
    withRefreshLock: lock,
  });
  globalThis.fetch = async (url, init) => {
    if (url.endsWith('/auth/refresh')) {
      refreshes++;
      await new Promise((done) => setTimeout(done, 10));
      return ok(tokens('rotated'));
    }
    return init.headers.Authorization === 'Bearer rotated' ? ok('current') : denied();
  };
  assert.deepEqual(await Promise.all([a.request('/a'), b.request('/b')]), ['current', 'current']);
  assert.equal(refreshes, 1);
});
test('peer logout invalidates a pending mutation before its result reaches the old account', async () => {
  const first = environment();
  first.client.session.set(tokens('old'));
  const second = environment(first.local);
  const entered = gate(),
    release = gate();
  globalThis.fetch = async () => {
    entered.resolve();
    await release.promise;
    return ok('old result');
  };
  const pending = second.client.request('/mutation', { method: 'POST' });
  const rejected = assert.rejects(pending);
  await entered.promise;
  first.client.session.clear();
  release.resolve();
  await rejected;
  assert.equal(second.client.session.hasTokens(), false);
});
test('peer account switch rejects an old page action without sending it as the new account', async () => {
  const first = environment();
  first.client.session.set(tokens('old'));
  const second = environment(first.local);
  let requests = 0,
    changes = 0;
  second.client.session.subscribe(() => changes++);
  first.client.session.set(tokens('new-account'));
  globalThis.fetch = async () => {
    requests++;
    return ok('wrong');
  };
  await assert.rejects(second.client.request('/mutation', { method: 'POST' }));
  assert.equal(requests, 0);
  assert.equal(changes, 1);
});
test('peer logout during refresh cannot restore a rotated session to persistent storage', async () => {
  const first = environment();
  first.client.session.set(tokens('old'));
  const second = environment(first.local);
  const entered = gate(),
    release = gate();
  globalThis.fetch = async (url) => {
    if (url.endsWith('/auth/refresh')) {
      entered.resolve();
      await release.promise;
      return ok(tokens('late'));
    }
    return denied();
  };
  const pending = first.client.request('/resource');
  const rejected = assert.rejects(pending);
  await entered.promise;
  second.client.session.clear();
  release.resolve();
  await rejected;
  assert.equal(environment(first.local).client.session.hasTokens(), false);
});
test('rejected refresh removes durable credentials, temporary server failure retains them', async () => {
  const state = environment();
  state.client.session.set(tokens('old'));
  globalThis.fetch = async (url) =>
    url.endsWith('/auth/refresh') ? new Response('{}', { status: 503 }) : denied();
  await assert.rejects(state.client.request('/resource'));
  assert.equal(environment(state.local).client.session.hasTokens(), true);
  globalThis.fetch = async () => denied();
  await assert.rejects(state.client.request('/resource'));
  assert.equal(environment(state.local).client.session.hasTokens(), false);
});

test('a rejected old refresh cannot delete a peer login before its storage event arrives', async () => {
  const first = environment();
  first.client.session.set(tokens('old'));
  const peer = environment(first.local),
    entered = gate(),
    release = gate();
  globalThis.fetch = async (url) => {
    if (url.endsWith('/auth/refresh')) {
      entered.resolve();
      await release.promise;
    }
    return denied();
  };
  const pending = first.client.request('/resource'),
    rejected = assert.rejects(pending);
  await entered.promise;
  peer.client.session.set(tokens('new-account'));
  release.resolve();
  await rejected;
  assert.equal(JSON.parse(first.local.getItem(first.browser.key)).accessToken, 'new-account');
});
test('a rejected old retry cannot clear a newer peer login', async () => {
  const first = environment();
  first.client.session.set(tokens('old'));
  const peer = environment(first.local),
    entered = gate(),
    release = gate();
  globalThis.fetch = async (url, init) => {
    if (url.endsWith('/auth/refresh')) return ok(tokens('rotated'));
    if (init.headers.Authorization === 'Bearer rotated') {
      entered.resolve();
      await release.promise;
    }
    return denied();
  };
  const pending = first.client.request('/resource'),
    rejected = assert.rejects(pending);
  await entered.promise;
  peer.client.session.set(tokens('new-account'));
  release.resolve();
  await rejected;
  assert.equal(JSON.parse(first.local.getItem(first.browser.key)).accessToken, 'new-account');
});
