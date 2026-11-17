import { request } from '../../../core/api/client';
import type { PagedResult } from '../../../core/api/contracts';
import type {
  FareInput,
  FareTable,
  Registration,
  RouteDetail,
  Schedule,
  ScheduleInput,
  SeatLayout,
  SeatLayoutInput,
  ServiceType,
  StopInput,
  TransportRoute,
  VehicleSeatLayout,
} from '../models/transport';

const org = (id: string) => '/organizations/' + encodeURIComponent(id);
const post = (body: unknown) => ({ method: 'POST', body: JSON.stringify(body) });
const put = (body: unknown) => ({ method: 'PUT', body: JSON.stringify(body) });

export const transportApi = {
  types: (signal: AbortSignal) => request<ServiceType[]>('/services/types', { signal }),
  registrations: (organizationId: string, signal?: AbortSignal) =>
    request<Registration[]>(org(organizationId) + '/services', { signal }),
  submitRegistration: (organizationId: string, serviceTypeCode: string, scopeNote: string) =>
    request<Registration>(org(organizationId) + '/services', post({ serviceTypeCode, scopeNote })),
  resubmitRegistration: (organizationId: string, item: Registration, scopeNote: string) =>
    request<Registration>(
      org(organizationId) + '/services/' + item.id + '/resubmit',
      post({ scopeNote, version: item.version }),
    ),
  withdrawRegistration: (organizationId: string, item: Registration, note: string) =>
    request<Registration>(
      org(organizationId) + '/services/' + item.id + '/withdraw',
      post({ note, version: item.version }),
    ),

  adminRegistrations: (
    page: number,
    status: string,
    serviceTypeCode: string,
    search: string,
    signal: AbortSignal,
  ) =>
    request<PagedResult<Registration>>(
      '/services/admin/registrations?pageNumber=' +
        page +
        '&pageSize=20' +
        (status ? '&status=' + encodeURIComponent(status) : '') +
        (serviceTypeCode ? '&serviceTypeCode=' + encodeURIComponent(serviceTypeCode) : '') +
        (search ? '&search=' + encodeURIComponent(search) : ''),
      { signal },
    ),
  adminRegistration: (id: string, signal: AbortSignal) =>
    request<Registration>('/services/admin/registrations/' + encodeURIComponent(id), { signal }),
  review: (item: Registration, decision: 'Approved' | 'Rejected', note: string) =>
    request<Registration>(
      '/services/admin/registrations/' + item.id + '/review',
      post({ decision, note, version: item.version }),
    ),
  suspend: (item: Registration, note: string) =>
    request<Registration>(
      '/services/admin/registrations/' + item.id + '/suspend',
      post({ note, version: item.version }),
    ),
  reinstate: (item: Registration, note: string) =>
    request<Registration>(
      '/services/admin/registrations/' + item.id + '/reinstate',
      post({ note, version: item.version }),
    ),
  adminRoutes: (organizationId: string, signal: AbortSignal) =>
    request<TransportRoute[]>(
      '/services/admin/organizations/' + encodeURIComponent(organizationId) + '/routes',
      { signal },
    ),
  adminDeactivateRoute: (route: TransportRoute, note: string) =>
    request<RouteDetail>(
      '/services/admin/routes/' + route.id + '/deactivate',
      post({ note, version: route.version }),
    ),

  routes: (organizationId: string, signal: AbortSignal) =>
    request<TransportRoute[]>(org(organizationId) + '/routes', { signal }),
  route: (organizationId: string, id: string, signal: AbortSignal) =>
    request<RouteDetail>(org(organizationId) + '/routes/' + encodeURIComponent(id), { signal }),
  createRoute: (organizationId: string, code: string, name: string) =>
    request<RouteDetail>(org(organizationId) + '/routes', post({ code, name })),
  updateRoute: (organizationId: string, route: TransportRoute, code: string, name: string) =>
    request<RouteDetail>(
      org(organizationId) + '/routes/' + route.id,
      put({ code, name, version: route.version }),
    ),
  createDraft: (organizationId: string, routeId: string) =>
    request<RouteDetail>(org(organizationId) + '/routes/' + routeId + '/revisions', {
      method: 'POST',
    }),
  saveDraft: (
    organizationId: string,
    routeId: string,
    revisionId: string,
    version: number,
    stops: StopInput[],
    note: string,
  ) =>
    request<RouteDetail>(
      org(organizationId) + '/routes/' + routeId + '/revisions/' + revisionId,
      put({
        version,
        note,
        stops: stops.map((stop) => ({
          sharedLocationId: stop.sharedLocationId,
          allowPickup: stop.allowPickup,
          allowDropoff: stop.allowDropoff,
          offsetMinutes: stop.offsetMinutes,
          dwellMinutes: stop.dwellMinutes,
        })),
      }),
    ),
  deleteDraft: (organizationId: string, routeId: string, revisionId: string) =>
    request<RouteDetail | null>(
      org(organizationId) + '/routes/' + routeId + '/revisions/' + revisionId,
      { method: 'DELETE' },
    ),
  publish: (organizationId: string, routeId: string, revisionId: string, version: number) =>
    request<RouteDetail>(
      org(organizationId) + '/routes/' + routeId + '/revisions/' + revisionId + '/publish',
      post({ version }),
    ),
  setRouteActive: (organizationId: string, route: TransportRoute, active: boolean, note: string) =>
    request<RouteDetail>(
      org(organizationId) + '/routes/' + route.id + (active ? '/activate' : '/deactivate'),
      post({ note, version: route.version }),
    ),

  templates: (signal: AbortSignal) =>
    request<SeatLayout[]>('/services/seat-layout-templates', { signal }),
  layouts: (organizationId: string, signal: AbortSignal) =>
    request<SeatLayout[]>(org(organizationId) + '/seat-layouts', { signal }),
  copyLayout: (organizationId: string, sourceLayoutId: string, name: string) =>
    request<SeatLayout>(org(organizationId) + '/seat-layouts', post({ sourceLayoutId, name })),
  createLayout: (organizationId: string, input: SeatLayoutInput) =>
    request<SeatLayout>(org(organizationId) + '/seat-layouts', post(input)),
  updateLayout: (organizationId: string, layout: SeatLayout, input: SeatLayoutInput) =>
    request<SeatLayout>(
      org(organizationId) + '/seat-layouts/' + layout.id,
      put({ ...input, version: layout.version }),
    ),
  archiveLayout: (organizationId: string, layout: SeatLayout) =>
    request(org(organizationId) + '/seat-layouts/' + layout.id + '?version=' + layout.version, {
      method: 'DELETE',
    }),
  vehicleLayouts: (organizationId: string, signal: AbortSignal) =>
    request<VehicleSeatLayout[]>(org(organizationId) + '/vehicle-seat-layouts', { signal }),
  attachLayout: (organizationId: string, vehicleId: string, layoutId: string) =>
    request<SeatLayout>(
      org(organizationId) + '/vehicles/' + encodeURIComponent(vehicleId) + '/seat-layout',
      put({ layoutId }),
    ),

  fares: (organizationId: string, routeId: string, signal: AbortSignal) =>
    request<FareTable[]>(
      org(organizationId) + '/routes/' + encodeURIComponent(routeId) + '/fares',
      {
        signal,
      },
    ),
  fare: (organizationId: string, routeId: string, id: string, signal: AbortSignal) =>
    request<FareTable>(
      org(organizationId) +
        '/routes/' +
        encodeURIComponent(routeId) +
        '/fares/' +
        encodeURIComponent(id),
      { signal },
    ),
  createFare: (organizationId: string, routeId: string, routeRevisionId: string) =>
    request<FareTable>(
      org(organizationId) + '/routes/' + routeId + '/fares',
      post({ routeRevisionId }),
    ),
  saveFare: (organizationId: string, table: FareTable, input: FareInput) =>
    request<FareTable>(
      org(organizationId) + '/routes/' + table.routeId + '/fares/' + table.id,
      put({ ...input, version: table.version }),
    ),
  publishFare: (organizationId: string, table: FareTable) =>
    request<FareTable>(
      org(organizationId) + '/routes/' + table.routeId + '/fares/' + table.id + '/publish',
      post({ version: table.version }),
    ),
  deleteFare: (organizationId: string, table: FareTable) =>
    request(
      org(organizationId) +
        '/routes/' +
        table.routeId +
        '/fares/' +
        table.id +
        '?version=' +
        table.version,
      { method: 'DELETE' },
    ),

  schedules: (organizationId: string, signal: AbortSignal) =>
    request<Schedule[]>(org(organizationId) + '/schedules', { signal }),
  createSchedule: (organizationId: string, input: ScheduleInput) =>
    request<Schedule>(org(organizationId) + '/schedules', post(input)),
  updateSchedule: (organizationId: string, schedule: Schedule, input: ScheduleInput) =>
    request<Schedule>(
      org(organizationId) + '/schedules/' + schedule.id,
      put({ ...input, version: schedule.version }),
    ),
  deleteSchedule: (organizationId: string, schedule: Schedule) =>
    request(org(organizationId) + '/schedules/' + schedule.id + '?version=' + schedule.version, {
      method: 'DELETE',
    }),
  scheduleAction: (
    organizationId: string,
    schedule: Schedule,
    action: 'activate' | 'pause' | 'end',
    reason: string,
  ) =>
    request<Schedule>(
      org(organizationId) + '/schedules/' + schedule.id + '/' + action,
      post({ reason, version: schedule.version }),
    ),
  replaceSchedule: (
    organizationId: string,
    schedule: Schedule,
    fromDate: string,
    input: ScheduleInput,
  ) =>
    request<Schedule>(
      org(organizationId) + '/schedules/' + schedule.id + '/replace',
      post({ fromDate, schedule: input, version: schedule.version }),
    ),
};
