export interface Envelope<T> { succeeded: boolean; message: string; errorCode: string | null; data: T; errors: Record<string, string[]> | null }
export interface Tokens { accessToken: string; refreshToken: string; accessTokenExpiresAt: string }
export interface User { accountGroup: string; accountId: string; userId: string; email: string; fullName: string; emailVerified: boolean; roles: string[]; permissions: string[] }
export interface Organization { id: string; name: string; registrationNumber: string; ownerEmail: string; reviewStatus: 'Pending' | 'Approved' | 'Rejected'; reviewNote: string | null; employeeLimit: number; driverLimit: number | null }
export class ApiError extends Error {
  constructor(public status: number, message: string, public code = '', public fields: Record<string, string[]> = {}) { super(message); this.name = 'ApiError'; }
}
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5267').replace(/\/+$/, '');
const KEY = 'transconnect.admin.session';
let tokens: Tokens | null = null;
try { const saved = sessionStorage.getItem(KEY); const value: unknown = saved ? JSON.parse(saved) : null; if (value && typeof value === 'object' && 'accessToken' in value && 'refreshToken' in value && typeof value.accessToken === 'string' && typeof value.refreshToken === 'string') tokens = value as Tokens; } catch { /* Storage can be unavailable in restricted browsers. */ }
let epoch = 0;
let generation = 0;
let refreshFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();
export const session = {
  hasTokens: () => Boolean(tokens),
  subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
  set: (next: Tokens, rotated = false) => { epoch++; if (!rotated) generation++; tokens = next; try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch { /* Keep an in-memory session. */ } },
  clear: () => { epoch++; generation++; tokens = null; try { sessionStorage.removeItem(KEY); } catch { /* Storage may be blocked. */ } listeners.forEach(listener => listener()); },
};
async function transport<T>(path: string, init: RequestInit, bearer?: string): Promise<T> {
  let response: Response;
  try { response = await fetch(API_BASE_URL + path, { ...init, headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(bearer ? { Authorization: 'Bearer ' + bearer } : {}), ...init.headers } }); }
  catch (error) { if (error instanceof DOMException && error.name === 'AbortError') throw error; throw new ApiError(0, 'Không thể kết nối máy chủ. Kiểm tra kết nối và cấu hình API.'); }
  let envelope: Envelope<T> | null = null;
  try { envelope = await response.json() as Envelope<T>; } catch { /* Reject non-JSON responses below. */ }
  if (!response.ok || !envelope?.succeeded) {
    const fallback: Record<number, string> = { 401: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.', 403: 'Bạn không có quyền thực hiện thao tác này.', 404: 'Không tìm thấy hồ sơ.', 409: 'Hồ sơ đã thay đổi. Hãy tải lại trước khi tiếp tục.', 429: 'Có quá nhiều yêu cầu. Vui lòng thử lại sau.' };
    throw new ApiError(response.status, envelope?.message || fallback[response.status] || 'Máy chủ trả về phản hồi không hợp lệ.', envelope?.errorCode || '', envelope?.errors || {});
  }
  return envelope.data;
}
async function refresh(): Promise<void> {
  if (refreshFlight) return refreshFlight;
  const current = tokens;
  const startEpoch = epoch;
  if (!current) throw new ApiError(401, 'Vui lòng đăng nhập lại.');
  const pending = (async () => {
    try {
      const next = await transport<Tokens>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken: current.refreshToken }) });
      if (epoch !== startEpoch) throw new ApiError(401, 'Phiên đăng nhập đã thay đổi.');
      session.set(next, true);
    } catch (error) { if (epoch === startEpoch) session.clear(); throw error; }
  })();
  refreshFlight = pending;
  try { await pending; } finally { if (refreshFlight === pending) refreshFlight = null; }
}
export async function request<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
  const startGeneration = generation;
  const bearer = tokens?.accessToken;
  try {
    const value = await transport<T>(path, init, authenticated ? bearer : undefined);
    if (authenticated && generation !== startGeneration) throw new ApiError(401, 'Phiên đăng nhập đã thay đổi.');
    return value;
  } catch (error) {
    if (generation !== startGeneration || !authenticated || !(error instanceof ApiError) || error.status !== 401 || !tokens) throw error;
    // A parallel request may already have rotated the token.
    if (tokens.accessToken === bearer) await refresh();
    const retryEpoch = epoch;
    const retryGeneration = generation;
    try {
      const value = await transport<T>(path, init, tokens?.accessToken);
      if (generation !== retryGeneration) throw new ApiError(401, 'Phiên đăng nhập đã thay đổi.');
      return value;
    } catch (retryError) { if (retryError instanceof ApiError && retryError.status === 401 && epoch === retryEpoch) session.clear(); throw retryError; }
  }
}
export async function login(email: string, password: string): Promise<void> {
  const next = await request<Tokens>('/auth/login', { method: 'POST', body: JSON.stringify({ accountGroup: 'InternalAdmin', email, password }) }, false);
  session.set(next);
}
export async function logout(): Promise<void> {
  const current = tokens;
  session.clear();
  if (current) await transport<unknown>('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: current.refreshToken }) }, current.accessToken);
}
export function errorMessage(error: unknown): string { return error instanceof Error ? error.message : 'Đã xảy ra lỗi. Vui lòng thử lại.'; }
