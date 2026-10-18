import { request, session, logout } from '../../../core/api/client';
import type { Tokens } from '../../../core/session/tokens';
import type { User } from '../models/user';

export const authApi = {
  currentUser: () => request<User>('/auth/me'),
  async login(email: string, password: string): Promise<void> {
    const next = await request<Tokens>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ accountGroup: 'InternalAdmin', email, password }),
      },
      false,
    );
    session.set(next);
  },
  logout,
};
