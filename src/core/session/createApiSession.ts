import { ApiError } from '../api/apiError';
import { createTransport } from '../api/transport';
import { isTokens, type Tokens } from './tokens';
export type TokenStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export interface SessionCoordination {
  syncStorage?: boolean;
  withRefreshLock?: (work: () => Promise<void>) => Promise<void>;
}
export function createApiSession(
  baseUrl: string,
  storage?: TokenStorage,
  coordination: SessionCoordination = {},
) {
  const transport = createTransport(baseUrl);
  const KEY = 'transconnect.admin.session';
  let tokens: Tokens | null = null;
  let identity: string | null = null;
  let savedValue: string | null = null;
  function decode(saved: string | null) {
    const value: unknown = saved ? JSON.parse(saved) : null;
    if (!isTokens(value)) return { tokens: null, identity: null };
    return {
      tokens: value,
      identity:
        'sessionId' in value && typeof value.sessionId === 'string' ? value.sessionId : 'legacy',
    };
  }
  try {
    savedValue = storage?.getItem(KEY) ?? null;
    const loaded = decode(savedValue);
    tokens = loaded.tokens;
    identity = loaded.identity;
  } catch {
    /* Storage can be unavailable in restricted browsers. */
  }
  let epoch = 0;
  let generation = 0;
  let refreshFlight: Promise<void> | null = null;
  let refreshGeneration: number | null = null;
  const listeners = new Set<() => void>();
  function syncStorage() {
    if (!coordination.syncStorage || !storage) return;
    let value: string | null;
    try {
      value = storage.getItem(KEY);
    } catch {
      return;
    }
    if (value === savedValue) return;
    let next;
    try {
      next = decode(value);
    } catch {
      next = { tokens: null, identity: null };
    }
    const changedIdentity = identity !== next.identity || Boolean(tokens) !== Boolean(next.tokens);
    epoch++;
    if (changedIdentity) generation++;
    savedValue = value;
    tokens = next.tokens;
    identity = next.identity;
    if (changedIdentity) listeners.forEach((listener) => listener());
  }
  const session = {
    sync: syncStorage,
    get generation() {
      return generation;
    },
    hasTokens: () => Boolean(tokens),
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set: (next: Tokens, rotated = false) => {
      if (!isTokens(next)) throw new ApiError(0, 'Dữ liệu phiên không hợp lệ.', 'INVALID_RESPONSE');
      epoch++;
      if (!rotated) generation++;
      tokens = next;
      if (!rotated || !identity) identity = crypto.randomUUID();
      savedValue = JSON.stringify({ ...next, sessionId: identity });
      try {
        storage?.setItem(KEY, savedValue);
      } catch {
        /* Keep an in-memory session. */
      }
    },
    clear: () => {
      epoch++;
      generation++;
      tokens = null;
      identity = null;
      savedValue = null;
      try {
        storage?.removeItem(KEY);
      } catch {
        /* Storage may be blocked. */
      }
      listeners.forEach((listener) => listener());
    },
  };
  async function refresh(): Promise<void> {
    if (refreshFlight && refreshGeneration === generation) return refreshFlight;
    const current = tokens;
    const startGeneration = generation;
    if (!current) throw new ApiError(401, 'Vui lòng đăng nhập lại.');
    const run = coordination.withRefreshLock ?? (async (work: () => Promise<void>) => work());
    const pending = run(async () => {
      syncStorage();
      if (generation !== startGeneration || !tokens)
        throw new ApiError(401, 'Phiên đăng nhập đã thay đổi.');
      if (tokens.accessToken !== current.accessToken) return;
      const startEpoch = epoch;
      try {
        const next = await transport<Tokens>('/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: current.refreshToken }),
        });
        syncStorage();
        if (epoch !== startEpoch) throw new ApiError(401, 'Phiên đăng nhập đã thay đổi.');
        session.set(next, true);
      } catch (error) {
        syncStorage();
        if (
          epoch === startEpoch &&
          error instanceof ApiError &&
          [400, 401, 403].includes(error.status)
        )
          session.clear();
        throw error;
      }
    });
    refreshFlight = pending;
    refreshGeneration = generation;
    try {
      await pending;
    } finally {
      if (refreshFlight === pending) {
        refreshFlight = null;
        refreshGeneration = null;
      }
    }
  }
  async function request<T>(
    path: string,
    init: RequestInit = {},
    authenticated = true,
  ): Promise<T> {
    const startGeneration = generation;
    syncStorage();
    if (authenticated && generation !== startGeneration)
      throw new ApiError(401, 'Phiên đăng nhập đã thay đổi.');
    const bearer = tokens?.accessToken;
    try {
      const value = await transport<T>(path, init, authenticated ? bearer : undefined);
      syncStorage();
      if (authenticated && generation !== startGeneration)
        throw new ApiError(401, 'Phiên đăng nhập đã thay đổi.');
      return value;
    } catch (error) {
      syncStorage();
      if (
        generation !== startGeneration ||
        !authenticated ||
        !(error instanceof ApiError) ||
        error.status !== 401 ||
        !tokens
      )
        throw error;
      // A parallel request may already have rotated the token.
      if (tokens.accessToken === bearer) await refresh();
      if (generation !== startGeneration || !tokens)
        throw new ApiError(401, 'Phiên đăng nhập đã thay đổi.');
      const retryEpoch = epoch;
      const retryGeneration = generation;
      try {
        const value = await transport<T>(path, init, tokens?.accessToken);
        syncStorage();
        if (generation !== retryGeneration) throw new ApiError(401, 'Phiên đăng nhập đã thay đổi.');
        return value;
      } catch (retryError) {
        syncStorage();
        if (generation !== retryGeneration) throw new ApiError(401, 'Phiên đăng nhập đã thay đổi.');
        if (retryError instanceof ApiError && retryError.status === 401 && epoch === retryEpoch)
          session.clear();
        throw retryError;
      }
    }
  }
  async function logout(): Promise<void> {
    syncStorage();
    const current = tokens;
    session.clear();
    if (current)
      await transport<unknown>(
        '/auth/logout',
        { method: 'POST', body: JSON.stringify({ refreshToken: current.refreshToken }) },
        current.accessToken,
      );
  }

  return { session, request, logout };
}
