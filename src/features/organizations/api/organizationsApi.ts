import { request } from '../../../core/api/client';
import type { Organization } from '../models/organization';
import type { PagedResult } from '../../../core/api/contracts';
export const organizationsApi = {
  search: (page: number, search: string, status: string, signal: AbortSignal) =>
    request<PagedResult<Organization>>(
      '/organizations/search?pageNumber=' +
        page +
        '&pageSize=20&search=' +
        encodeURIComponent(search) +
        (status && status !== 'all' ? '&status=' + status : ''),
      { signal },
    ),
  submit: (name: string, registrationNumber: string, id?: string, ownerEmail?: string) =>
    request<Organization>(
      id ? `/organizations/${encodeURIComponent(id)}/resubmit` : '/organizations',
      { method: 'POST', body: JSON.stringify({ name, registrationNumber, ownerEmail }) },
    ),
  list: (signal?: AbortSignal) => request<Organization[]>('/organizations', { signal }),
  reinviteOwner: (id: string) =>
    request('/organizations/' + encodeURIComponent(id) + '/owner-invitation', { method: 'POST' }),
  get: (id: string, signal?: AbortSignal) =>
    request<Organization>('/organizations/' + encodeURIComponent(id), { signal }),
  review: (id: string, approved: boolean, note: string) =>
    request<Organization>('/organizations/' + encodeURIComponent(id) + '/review', {
      method: 'POST',
      body: JSON.stringify({ approved, note }),
    }),
};
