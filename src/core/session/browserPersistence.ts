import type { TokenStorage } from './createApiSession';
import { isTokens } from './tokens';

export const LEGACY_SESSION_KEY = 'transconnect.admin.session';
export function createBrowserPersistence(
  baseUrl: string,
  host: Pick<Window, 'localStorage' | 'sessionStorage'>,
) {
  const key = 'transconnect.management.session:' + new URL(baseUrl).href.replace(/\/$/, '');
  let target: TokenStorage | undefined;
  let durable = false;
  let memory: string | null = null;
  let migrated = false;
  try {
    target = host.localStorage;
    target.getItem(key);
    durable = true;
  } catch {
    try {
      target = host.sessionStorage;
      target.getItem(key);
    } catch {
      target = undefined;
    }
  }
  function save(value: string | null) {
    memory = value;
    try {
      if (value === null) target?.removeItem(key);
      else target?.setItem(key, value);
    } catch {
      target = undefined;
      durable = false;
    }
  }
  const storage: TokenStorage = {
    getItem: () => {
      try {
        if (target) memory = target.getItem(key);
      } catch {
        target = undefined;
        durable = false;
      }
      if (!migrated) {
        migrated = true;
        try {
          const legacy = host.sessionStorage.getItem(LEGACY_SESSION_KEY);
          if (!memory && legacy && isTokens(JSON.parse(legacy))) save(legacy);
          // Remove the old tab value so logout cannot resurrect it later.
          host.sessionStorage.removeItem(LEGACY_SESSION_KEY);
        } catch {
          /* Restricted or malformed legacy storage is not an authenticated session. */
        }
      }
      return memory;
    },
    setItem: (_key, value) => save(value),
    removeItem: () => save(null),
  };
  return {
    storage,
    key,
    get durable() {
      return durable;
    },
  };
}
