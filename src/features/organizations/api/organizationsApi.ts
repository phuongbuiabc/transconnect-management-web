import { request } from '../../../core/api/client';
import type { Organization } from '../models/organization';
export const organizationsApi = {
  list: (signal?: AbortSignal) => request<Organization[]>('/organizations', { signal }),
  get: (id: string, signal?: AbortSignal) =>
    request<Organization>('/organizations/' + encodeURIComponent(id), { signal }),
  review: (id: string, approved: boolean, note: string) =>
    request<Organization>('/organizations/' + encodeURIComponent(id) + '/review', {
      method: 'POST',
      body: JSON.stringify({ approved, note }),
    }),
};
