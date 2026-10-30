import { API_BASE_URL } from '../config/appConfig';
import { createApiSession } from '../session/createApiSession';
import { createBrowserPersistence } from '../session/browserPersistence';
const persistence = createBrowserPersistence(API_BASE_URL, window);
export const { request, session, logout } = createApiSession(API_BASE_URL, persistence.storage, {
  syncStorage: true,
  withRefreshLock: navigator.locks
    ? (work) => navigator.locks.request(persistence.key, work)
    : undefined,
});
function synchronize(event: StorageEvent) {
  if (event.key === persistence.key || event.key === null) session.sync();
}
window.addEventListener('storage', synchronize);
if (import.meta.hot)
  import.meta.hot.dispose(() => window.removeEventListener('storage', synchronize));
