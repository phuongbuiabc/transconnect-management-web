import { useCallback } from 'react';
import { useFoundation } from '../../foundation/hooks/useFoundation';
import { bookingApi } from '../api/bookingApi';

/** Đặt chỗ + sơ đồ ghế của một chuyến cho đoạn đang xem. */
export function useTripBookings(organizationId: string, tripId: string, from: number, to: number) {
  const load = useCallback(
    async (signal: AbortSignal) => {
      const [bookings, map] = await Promise.all([
        bookingApi.forTrip(organizationId, tripId, signal),
        from && to ? bookingApi.seatMap(organizationId, tripId, from, to, signal) : null,
      ]);
      return { bookings, map };
    },
    [organizationId, tripId, from, to],
  );
  return useFoundation(load);
}

export function usePendingBookings(organizationId: string) {
  const load = useCallback(
    (signal: AbortSignal) => bookingApi.pending(organizationId, signal),
    [organizationId],
  );
  return useFoundation(load);
}

export function useBookingPolicy(organizationId: string) {
  const load = useCallback(
    (signal: AbortSignal) => bookingApi.policy(organizationId, signal),
    [organizationId],
  );
  return useFoundation(load);
}

export function useAdminBookings(code: string) {
  const load = useCallback((signal: AbortSignal) => bookingApi.adminList(code, signal), [code]);
  return useFoundation(load);
}
