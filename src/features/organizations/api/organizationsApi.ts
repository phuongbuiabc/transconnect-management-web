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
  submit: (
    name: string,
    registrationNumber: string,
    requestedServiceTypes: string[],
    id?: string,
    ownerEmail?: string,
  ) =>
    request<Organization>(
      id ? `/organizations/${encodeURIComponent(id)}/resubmit` : '/organizations',
      {
        method: 'POST',
        body: JSON.stringify({ name, registrationNumber, ownerEmail, requestedServiceTypes }),
      },
    ),
  /** Wizard đăng ký đối tác: nộp/nộp lại kèm hồ sơ tùy chọn (Q-PARTNER-REG-D1 B). */
  apply: (
    body: {
      name: string;
      registrationNumber: string;
      requestedServiceTypes: string[];
      legalEntityType: string | null;
      registeredAddress: string | null;
      contactPhone: string | null;
      contactEmail: string | null;
    },
    resubmitId?: string | null,
  ) =>
    request<Organization>(
      resubmitId ? `/organizations/${encodeURIComponent(resubmitId)}/resubmit` : '/organizations',
      { method: 'POST', body: JSON.stringify(body) },
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
