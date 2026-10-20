import { request, session, logout } from '../../../core/api/client';
import type { Tokens } from '../../../core/session/tokens';
import type { User } from '../models/user';
import { ApiError } from '../../../core/api/apiError';

export const authApi = {
  updateProfile: (fullName: string, phoneNumber: string) =>
    request<User>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify({ fullName, phoneNumber: phoneNumber || null }),
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  uploadAvatar: (file: File) => {
    const body = new FormData();
    body.set('file', file);
    return request('/auth/me/avatar', { method: 'POST', body });
  },
  currentUser: () => request<User>('/auth/me'),
  async login(email: string, password: string, accountGroup = 'InternalAdmin'): Promise<void> {
    const started = session.generation;
    const next = await request<Tokens>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ accountGroup, email, password }),
      },
      false,
    );
    if (started !== session.generation) throw new ApiError(401, 'Phiên đăng nhập đã thay đổi.');
    session.set(next);
  },
  async register(email: string, password: string, fullName: string): Promise<void> {
    const started = session.generation;
    const next = await request<Tokens>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName, accountGroup: 'Operator' }),
      },
      false,
    );
    if (started !== session.generation) throw new ApiError(401, 'Phiên đăng nhập đã thay đổi.');
    session.set(next);
  },
  verify: (email: string, code: string) =>
    request(
      '/auth/verify-email',
      { method: 'POST', body: JSON.stringify({ email, code, accountGroup: 'Operator' }) },
      false,
    ),
  resend: (email: string) =>
    request(
      '/auth/resend-verification',
      { method: 'POST', body: JSON.stringify({ email, accountGroup: 'Operator' }) },
      false,
    ),
  logout,
};
