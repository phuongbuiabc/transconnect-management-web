import { request } from '../../../core/api/client';
import type {
  CrewInput,
  OrderVerification,
  QuickTripInput,
  TransportOrder,
  Trip,
} from '../models/trips';

const org = (id: string) => '/organizations/' + encodeURIComponent(id);
const trip = (organizationId: string, id: string) =>
  org(organizationId) + '/trips/' + encodeURIComponent(id);
const post = (body: unknown) => ({ method: 'POST', body: JSON.stringify(body) });
const put = (body: unknown) => ({ method: 'PUT', body: JSON.stringify(body) });

export interface TripFilter {
  from: string;
  to: string;
  routeId: string;
  status: string;
  unassigned: boolean;
}

/** Chuyến (M3): danh sách, chuyến nhanh, phân công, trạng thái và lệnh vận chuyển mô phỏng. */
export const tripsApi = {
  list: (organizationId: string, f: TripFilter, signal: AbortSignal) =>
    request<Trip[]>(
      org(organizationId) +
        '/trips?from=' +
        f.from +
        '&to=' +
        f.to +
        (f.routeId ? '&routeId=' + encodeURIComponent(f.routeId) : '') +
        (f.status ? '&status=' + encodeURIComponent(f.status) : '') +
        (f.unassigned ? '&unassigned=true' : ''),
      { signal },
    ),
  get: (organizationId: string, id: string, signal: AbortSignal) =>
    request<Trip>(trip(organizationId, id), { signal }),
  createQuick: (organizationId: string, input: QuickTripInput) =>
    request<Trip>(org(organizationId) + '/trips', post(input)),
  generate: (organizationId: string, scheduleId: string) =>
    request<{ created: number; from: string; to: string }>(
      org(organizationId) + '/schedules/' + encodeURIComponent(scheduleId) + '/generate-trips',
      post({}),
    ),
  assignVehicle: (organizationId: string, t: Trip, vehicleId: string | null) =>
    request<Trip>(trip(organizationId, t.id) + '/vehicle', put({ vehicleId, version: t.version })),
  assignCrew: (organizationId: string, t: Trip, crew: CrewInput) =>
    request<Trip>(trip(organizationId, t.id) + '/crew', put({ ...crew, version: t.version })),
  delay: (organizationId: string, t: Trip, delayMinutes: number, reason: string) =>
    request<Trip>(
      trip(organizationId, t.id) + '/delay',
      post({ delayMinutes, reason, version: t.version }),
    ),
  action: (
    organizationId: string,
    t: Trip,
    action: 'depart' | 'complete' | 'cancel',
    reason: string,
  ) =>
    request<Trip>(trip(organizationId, t.id) + '/' + action, post({ reason, version: t.version })),
  order: (organizationId: string, tripId: string, signal: AbortSignal) =>
    request<TransportOrder | null>(trip(organizationId, tripId) + '/transport-order', { signal }),
  issueOrder: (organizationId: string, tripId: string) =>
    request<TransportOrder>(trip(organizationId, tripId) + '/transport-order', post({})),
  revokeOrder: (organizationId: string, tripId: string, order: TransportOrder, reason: string) =>
    request<TransportOrder>(
      trip(organizationId, tripId) + '/transport-order/revoke',
      post({ reason, version: order.version }),
    ),

  adminList: (from: string, to: string, status: string, signal: AbortSignal) =>
    request<Trip[]>(
      '/services/admin/trips?from=' +
        from +
        '&to=' +
        to +
        (status ? '&status=' + encodeURIComponent(status) : ''),
      { signal },
    ),

  stationFind: (number: string, signal: AbortSignal) =>
    request<TransportOrder>('/stations/transport-orders?number=' + encodeURIComponent(number), {
      signal,
    }),
  stationConfirm: (
    order: TransportOrder,
    step: 'confirm-departure' | 'confirm-arrival',
    passengerCount: number,
  ) =>
    request<TransportOrder>(
      '/stations/transport-orders/' + order.id + '/' + step,
      post({ passengerCount, version: order.version }),
    ),

  verify: (code: string, signal: AbortSignal) =>
    request<OrderVerification>('/transport-orders/verify/' + encodeURIComponent(code), { signal }),
};
