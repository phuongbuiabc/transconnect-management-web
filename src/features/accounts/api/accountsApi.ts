import { request } from '../../../core/api/client';
import type { PagedResult } from '../../../core/api/contracts';
export interface Account {
  id: string;
  accountGroup: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  isActive: boolean;
  avatarUrl: string | null;
  emailVerified: boolean;
}
export type AccountPage = PagedResult<Account>;
export interface AccountAudit {
  id: string;
  wasActive: boolean | null;
  isActive: boolean | null;
  reason: string | null;
  createdAt: string;
  requestId: string | null;
}
export const accountsApi = {
  detail: (id: string, signal: AbortSignal) =>
    request<Account>('/accounts/' + encodeURIComponent(id), { signal }),
  audit: (id: string, pageNumber: number, signal: AbortSignal) =>
    request<PagedResult<AccountAudit>>(
      '/accounts/' + encodeURIComponent(id) + '/audit?pageNumber=' + pageNumber,
      { signal },
    ),
  list: (page: number, search: string, signal: AbortSignal) =>
    request<AccountPage>(
      `/accounts?pageNumber=${page}&pageSize=20&search=${encodeURIComponent(search)}`,
      { signal },
    ),
  status: (id: string, isActive: boolean, reason: string) =>
    request<Account>(`/accounts/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive, reason }),
    }),
};
