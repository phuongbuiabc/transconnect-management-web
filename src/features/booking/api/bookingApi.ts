import { request } from '../../../core/api/client';
import type { Booking, BookingPolicy, SeatMap, WalkInInput } from '../models/booking';

const org = (id: string) => '/organizations/' + encodeURIComponent(id);
const post = (body: unknown) => ({ method: 'POST', body: JSON.stringify(body) });

/** Đặt chỗ phía nhà xe (M4a): theo chuyến, sơ đồ ghế theo đoạn, vé ngoài, duyệt, chính sách. */
export const bookingApi = {
  forTrip: (organizationId: string, tripId: string, signal: AbortSignal) =>
    request<Booking[]>(org(organizationId) + '/trips/' + encodeURIComponent(tripId) + '/bookings', {
      signal,
    }),
  seatMap: (
    organizationId: string,
    tripId: string,
    from: number,
    to: number,
    signal: AbortSignal,
  ) =>
    request<SeatMap>(
      org(organizationId) +
        '/trips/' +
        encodeURIComponent(tripId) +
        '/seat-map?from=' +
        from +
        '&to=' +
        to,
      { signal },
    ),
  walkIn: (organizationId: string, tripId: string, input: WalkInInput) =>
    request<Booking>(
      org(organizationId) + '/trips/' + encodeURIComponent(tripId) + '/bookings',
      post(input),
    ),
  pending: (organizationId: string, signal: AbortSignal) =>
    request<Booking[]>(org(organizationId) + '/bookings/pending', { signal }),
  approve: (organizationId: string, b: Booking, seats: string[]) =>
    request<Booking>(
      org(organizationId) + '/bookings/' + b.id + '/approve',
      post({ seats, version: b.version }),
    ),
  reject: (organizationId: string, b: Booking, reason: string) =>
    request<Booking>(
      org(organizationId) + '/bookings/' + b.id + '/reject',
      post({ reason, version: b.version }),
    ),
  cancel: (organizationId: string, b: Booking, reason: string) =>
    request<Booking>(
      org(organizationId) + '/bookings/' + b.id + '/cancel',
      post({ reason, version: b.version }),
    ),
  policy: (organizationId: string, signal: AbortSignal) =>
    request<BookingPolicy>(org(organizationId) + '/booking-policy', { signal }),
  savePolicy: (organizationId: string, p: BookingPolicy) =>
    request<BookingPolicy>(org(organizationId) + '/booking-policy', {
      method: 'PUT',
      body: JSON.stringify(p),
    }),
  adminList: (code: string, signal: AbortSignal) =>
    request<Booking[]>(
      '/services/admin/bookings' + (code ? '?code=' + encodeURIComponent(code) : ''),
      { signal },
    ),
};
