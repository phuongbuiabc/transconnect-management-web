import { ApiError } from '../api/apiError';
import { createTransport } from '../api/transport';
import { isTokens, type Tokens } from './tokens';
export type TokenStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export function createApiSession(baseUrl: string, storage?: TokenStorage) {
  const transport = createTransport(baseUrl);
  const KEY = 'transconnect.admin.session';
  let tokens: Tokens | null = null;
  try {
    const saved = storage?.getItem(KEY);
    const value: unknown = saved ? JSON.parse(saved) : null;
    if (isTokens(value)) tokens = value;
  } catch {
    /* Storage can be unavailable in restricted browsers. */
  }
  let epoch = 0;
  let generation = 0;
  let refreshFlight: Promise<void> | null = null;
  let refreshGeneration: number | null = null;
  const listeners = new Set<() => void>();
  const session = {
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
      try {
        storage?.setItem(KEY, JSON.stringify(next));
      } catch {
        /* Keep an in-memory session. */
      }
    },
    clear: () => {
      epoch++;
      generation++;
      tokens = null;
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
    const startEpoch = epoch;
    if (!current) throw new ApiError(401, 'Vui lòng đăng nhập lại.');
    const pending = (async () => {
      try {
        const next = await transport<Tokens>('/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: current.refreshToken }),
        });
        if (epoch !== startEpoch) throw new ApiError(401, 'Phiên đăng nhập đã thay đổi.');
        session.set(next, true);
      } catch (error) {
        if (
          epoch === startEpoch &&
          error instanceof ApiError &&
          [400, 401, 403].includes(error.status)
        )
          session.clear();
        throw error;
      }
    })();
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
    const bearer = tokens?.accessToken;
    try {
      const value = await transport<T>(path, init, authenticated ? bearer : undefined);
      if (authenticated && generation !== startGeneration)
        throw new ApiError(401, 'Phiên đăng nhập đã thay đổi.');
      return value;
    } catch (error) {
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
        if (generation !== retryGeneration) throw new ApiError(401, 'Phiên đăng nhập đã thay đổi.');
        return value;
      } catch (retryError) {
        if (retryError instanceof ApiError && retryError.status === 401 && epoch === retryEpoch)
          session.clear();
        throw retryError;
      }
    }
  }
  async function logout(): Promise<void> {
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
