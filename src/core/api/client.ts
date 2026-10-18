import { API_BASE_URL } from '../config/appConfig';
import { createApiSession, type TokenStorage } from '../session/createApiSession';
let storage: TokenStorage | undefined;
try {
  storage = window.sessionStorage;
} catch {
  /* Restricted browsers use memory. */
}
export const { request, session, logout } = createApiSession(API_BASE_URL, storage);
