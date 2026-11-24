import { useCallback, useEffect, useState } from 'react';
import { foundationApi } from '../../foundation/api/foundationApi';
import { useFoundation } from '../../foundation/hooks/useFoundation';
import { locationsApi } from '../../locations/api/locationsApi';
import type { SharedLocation } from '../../locations/models/location';
import { transportApi } from '../api/transportApi';
import { tripsApi, type TripFilter } from '../api/tripsApi';
import { coachAccess } from '../models/scheduleRules';

/** Đăng ký dịch vụ của tổ chức + danh mục loại dịch vụ. */
export function useServiceRegistrations(organizationId: string) {
  const load = useCallback(
    async (signal: AbortSignal) => {
      const [types, registrations] = await Promise.all([
        transportApi.types(signal),
        transportApi.registrations(organizationId, signal),
      ]);
      return { types, registrations };
    },
    [organizationId],
  );
  return useFoundation(load);
}

/** Dùng cho menu Partner: chỉ hiện Tuyến / Sơ đồ ghế / Lịch chạy khi xe khách đã được duyệt. */
export function useCoachAccess(organizationId: string | undefined) {
  const load = useCallback(
    (signal: AbortSignal) =>
      organizationId ? transportApi.registrations(organizationId, signal) : Promise.resolve([]),
    [organizationId],
  );
  const state = useFoundation(load);
  return { ...coachAccess(state.data), loading: state.loading, reload: state.reload };
}

export function useAdminRegistrations(
  page: number,
  status: string,
  serviceTypeCode: string,
  search: string,
) {
  const load = useCallback(
    (signal: AbortSignal) =>
      transportApi.adminRegistrations(page, status, serviceTypeCode, search, signal),
    [page, status, serviceTypeCode, search],
  );
  return useFoundation(load);
}

export function useAdminRegistration(id: string) {
  const load = useCallback(
    async (signal: AbortSignal) => {
      const registration = await transportApi.adminRegistration(id, signal);
      const routes =
        registration.serviceTypeCode === 'FIXED_ROUTE_COACH' && registration.status !== 'Pending'
          ? await transportApi.adminRoutes(registration.organizationId, signal)
          : [];
      return { registration, routes };
    },
    [id],
  );
  return useFoundation(load);
}

export function useRoutes(organizationId: string) {
  const load = useCallback(
    (signal: AbortSignal) => transportApi.routes(organizationId, signal),
    [organizationId],
  );
  return useFoundation(load);
}

export function useRouteDetail(organizationId: string, routeId: string) {
  const load = useCallback(
    (signal: AbortSignal) => transportApi.route(organizationId, routeId, signal),
    [organizationId, routeId],
  );
  return useFoundation(load);
}

/** Tuyến kèm các bảng giá của tuyến (mọi bản tuyến). */
export function useRouteFares(organizationId: string, routeId: string) {
  const load = useCallback(
    async (signal: AbortSignal) => {
      const [detail, fares] = await Promise.all([
        transportApi.route(organizationId, routeId, signal),
        transportApi.fares(organizationId, routeId, signal),
      ]);
      return { detail, fares };
    },
    [organizationId, routeId],
  );
  return useFoundation(load);
}

export function useFareDetail(organizationId: string, routeId: string, id: string) {
  const load = useCallback(
    (signal: AbortSignal) => transportApi.fare(organizationId, routeId, id, signal),
    [organizationId, routeId, id],
  );
  return useFoundation(load);
}

/** Sơ đồ ghế: mẫu hệ thống, sơ đồ của tổ chức, xe đang quản lý và sơ đồ đang gắn với xe. */
export function useSeatLayouts(organizationId: string) {
  const load = useCallback(
    async (signal: AbortSignal) => {
      const [templates, layouts, vehicles, attached] = await Promise.all([
        transportApi.templates(signal),
        transportApi.layouts(organizationId, signal),
        foundationApi.vehicles(organizationId, signal),
        transportApi.vehicleLayouts(organizationId, signal),
      ]);
      return {
        templates,
        layouts,
        vehicles: vehicles.filter((v) => !v.endedAt),
        attached,
      };
    },
    [organizationId],
  );
  return useFoundation(load);
}

/** Lịch chạy cùng dữ liệu tham chiếu để chọn tuyến, xe và ghế VieGo. */
export function useSchedules(organizationId: string) {
  const load = useCallback(
    async (signal: AbortSignal) => {
      const [schedules, routes, vehicles, attached, layouts] = await Promise.all([
        transportApi.schedules(organizationId, signal),
        transportApi.routes(organizationId, signal),
        foundationApi.vehicles(organizationId, signal),
        transportApi.vehicleLayouts(organizationId, signal),
        transportApi.layouts(organizationId, signal),
      ]);
      return {
        schedules,
        routes,
        vehicles: vehicles.filter((v) => !v.endedAt && !v.isSuspended),
        attached,
        layouts,
      };
    },
    [organizationId],
  );
  return useFoundation(load);
}

/** Tìm địa điểm dùng chung (đã duyệt) để làm điểm dừng; trì hoãn 300 ms giữa các lần gõ. */
export function useSharedLocationSearch(query: string) {
  const [items, setItems] = useState<SharedLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setItems([]);
      setError(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      locationsApi
        .shared(term, 1, controller.signal)
        .then((page) => {
          setItems(page.items.filter((item) => item.isActive));
          setError(null);
        })
        .catch((failure) => {
          if (!controller.signal.aborted) setError(failure);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  return { items, loading, error };
}

/** Chuyến theo khoảng ngày + dữ liệu chọn tuyến/xe/tài xế cho phân công. */
export function useTrips(organizationId: string, filter: TripFilter) {
  const { from, to, routeId, status, unassigned } = filter;
  const load = useCallback(
    async (signal: AbortSignal) => {
      const [trips, routes, vehicles, attached, drivers] = await Promise.all([
        tripsApi.list(organizationId, { from, to, routeId, status, unassigned }, signal),
        transportApi.routes(organizationId, signal),
        foundationApi.vehicles(organizationId, signal),
        transportApi.vehicleLayouts(organizationId, signal),
        activeDrivers(organizationId, signal),
      ]);
      const withLayout = new Set(attached.map((a) => a.vehicleId));
      return {
        trips,
        routes,
        vehicles: vehicles.filter(
          (v) => !v.endedAt && !v.isSuspended && withLayout.has(v.vehicleId),
        ),
        drivers,
      };
    },
    [organizationId, from, to, routeId, status, unassigned],
  );
  return useFoundation(load);
}

/** Tài xế đang cộng tác (đã nhận lời mời, chưa kết thúc) — đọc tối đa 10 trang. */
async function activeDrivers(organizationId: string, signal: AbortSignal) {
  const items = [];
  for (let page = 1; page <= 10; page++) {
    const result = await foundationApi.engagements(organizationId, page, signal);
    items.push(...result.items);
    if (page >= result.totalPages) break;
  }
  return items
    .filter((e) => e.acceptedAt && !e.endedAt && !e.revokedAt)
    .map((e) => ({ driverId: e.driverId, fullName: e.fullName }));
}

export function useTripDetail(organizationId: string, tripId: string) {
  const load = useCallback(
    async (signal: AbortSignal) => {
      const [trip, order] = await Promise.all([
        tripsApi.get(organizationId, tripId, signal),
        tripsApi.order(organizationId, tripId, signal),
      ]);
      return { trip, order };
    },
    [organizationId, tripId],
  );
  return useFoundation(load);
}

export function useAdminTrips(from: string, to: string, status: string) {
  const load = useCallback(
    (signal: AbortSignal) => tripsApi.adminList(from, to, status, signal),
    [from, to, status],
  );
  return useFoundation(load);
}

/** Bến xe mô phỏng: tra lệnh theo số; chuỗi rỗng thì không gọi API. */
export function useStationOrder(number: string) {
  const load = useCallback(
    (signal: AbortSignal) =>
      number ? tripsApi.stationFind(number, signal) : Promise.resolve(null),
    [number],
  );
  return useFoundation(load);
}

export function useOrderVerification(code: string) {
  const load = useCallback((signal: AbortSignal) => tripsApi.verify(code, signal), [code]);
  return useFoundation(load);
}
