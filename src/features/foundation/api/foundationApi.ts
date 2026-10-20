import { request } from '../../../core/api/client';
import type { Organization } from '../../organizations/models/organization';
import type { EngagementContact } from '../models/foundation';
import type {
  Context,
  Driver,
  Page,
  Review,
  Member,
  Engagement,
  Invitation,
  Vehicle,
  ProfileVersion,
} from '../models/foundation';
const org = (id: string) => '/organizations/' + encodeURIComponent(id);
const version = (id: string) =>
  '/compliance/demo/profile-documents/versions/' + encodeURIComponent(id);
export const foundationApi = {
  engagementContact: (organizationId: string, engagementId: string, signal: AbortSignal) =>
    request<EngagementContact>(
      org(organizationId) + '/drivers/' + encodeURIComponent(engagementId) + '/profile',
      { signal },
    ),
  organization: (id: string, signal: AbortSignal) => request<Organization>(org(id), { signal }),
  context: (signal: AbortSignal) => request<Context>('/operator/context', { signal }),
  downloadDocument: (id: string) =>
    request<Blob>(version(id) + '/download', { headers: { Accept: 'application/octet-stream' } }),
  drivers: (page: number, status: string, search: string, signal: AbortSignal) =>
    request<Page<Driver>>(
      '/drivers/search?pageNumber=' +
        page +
        '&pageSize=20' +
        (status ? '&status=' + status : '') +
        '&search=' +
        encodeURIComponent(search),
      { signal },
    ),
  reviewDriver: (id: string, approved: boolean, note: string) =>
    request<Driver>('/drivers/' + encodeURIComponent(id) + '/review', {
      method: 'POST',
      body: JSON.stringify({ approved, note }),
    }),
  history: (type: 'drivers' | 'organizations', id: string, signal: AbortSignal) =>
    request<Review[]>('/' + type + '/' + encodeURIComponent(id) + '/reviews', { signal }),
  members: (id: string, page: number, signal: AbortSignal) =>
    request<Page<Member>>(org(id) + '/members/search?pageNumber=' + page + '&pageSize=20', {
      signal,
    }),
  engagements: (id: string, page: number, signal: AbortSignal) =>
    request<Page<Engagement>>(org(id) + '/drivers/search?pageNumber=' + page + '&pageSize=20', {
      signal,
    }),
  invitations: (id: string | undefined, signal: AbortSignal) =>
    request<Invitation[]>(id ? org(id) + '/invitations' : '/operator/invitations', { signal }),
  vehicles: (id: string, signal: AbortSignal) =>
    request<Vehicle[]>(org(id) + '/vehicles', { signal }),
  invite: (id: string, email: string, role: string) =>
    request(org(id) + (role === 'Driver' ? '/driver-invitations' : '/invitations'), {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),
  accept: (token: string, driver: boolean) =>
    request(driver ? '/drivers/invitations/accept' : '/organizations/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
  revoke: (id: string, invitationId: string) =>
    request(org(id) + '/invitations/' + encodeURIComponent(invitationId), { method: 'DELETE' }),
  updateMember: (id: string, member: Member, role: string, isActive: boolean) =>
    request(org(id) + '/members/' + encodeURIComponent(member.id), {
      method: 'PUT',
      body: JSON.stringify({ role, isActive }),
    }),
  endEngagement: (id: string, engagementId: string) =>
    request(org(id) + '/drivers/' + encodeURIComponent(engagementId), { method: 'DELETE' }),
  suspension: (id: string, vehicle: Vehicle) =>
    request(org(id) + '/vehicles/' + encodeURIComponent(vehicle.linkId) + '/suspension', {
      method: 'PUT',
      body: JSON.stringify({ isSuspended: !vehicle.isSuspended }),
    }),
  endVehicle: (id: string, linkId: string, reason: string) =>
    request(org(id) + '/vehicles/' + encodeURIComponent(linkId), {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    }),
  linkVehicle: (id: string, registrationPlate: string, verificationReference: string) =>
    request(org(id) + '/vehicles', {
      method: 'POST',
      body: JSON.stringify({ registrationPlate, verificationReference }),
    }),
  vehicleProfile: (id: string, vehicle: Vehicle, kind: string, capacity: number) =>
    request(org(id) + '/vehicles/' + encodeURIComponent(vehicle.linkId) + '/profile', {
      method: 'PUT',
      body: JSON.stringify({
        vehicleKind: kind,
        seatCount: kind === 'Passenger' ? capacity : null,
        permittedPayloadKg: kind === 'Freight' ? capacity : null,
      }),
    }),
  organizationProfile: (
    id: string,
    values: {
      legalEntityType: string;
      registeredAddress: string;
      contactPhone: string;
      contactEmail: string;
    },
  ) => request(org(id) + '/profile', { method: 'PUT', body: JSON.stringify(values) }),
  documents: (type: string, id: string, documentType: string, signal: AbortSignal) =>
    request<ProfileVersion[]>(
      '/compliance/demo/profile-documents/' +
        type +
        '/' +
        encodeURIComponent(id) +
        '/' +
        documentType,
      { signal },
    ),
  uploadDocument: (type: string, id: string, documentType: string, file: File) => {
    const form = new FormData();
    form.set('file', file);
    form.set('SyntheticDataConfirmed', 'true');
    return request<ProfileVersion>(
      '/compliance/demo/profile-documents/' +
        type +
        '/' +
        encodeURIComponent(id) +
        '/' +
        documentType,
      { method: 'POST', body: form },
    );
  },
  documentAction: (id: string, action: 'simulate' | 'review' | 'delete') =>
    request(version(id) + (action === 'delete' ? '' : '/' + action), {
      method: action === 'delete' ? 'DELETE' : 'POST',
      body:
        action === 'delete'
          ? undefined
          : JSON.stringify(action === 'simulate' ? { scenario: 'Success' } : { approved: true }),
    }),
};
