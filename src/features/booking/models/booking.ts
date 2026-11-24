// M4a — đặt vé theo chặng (contract Docs/05-api/endpoints/booking-endpoints.md).

export type BookingStatus =
  'Requested' | 'Held' | 'Confirmed' | 'Rejected' | 'Expired' | 'Cancelled' | 'Completed';
export type BookingChannel = 'VieGo' | 'Operator' | 'ShareLink';
export type SeatState = 'Available' | 'Taken' | 'NotForSale';

export interface BookingTicket {
  seatLabel: string;
  ticketCode: string;
  qrPayload: string;
  boardingStatus: 'NotBoarded' | 'Boarded' | 'Alighted' | 'NoShow';
  checkedAt: string | null;
}

export interface Booking {
  id: string;
  code: string;
  tripId: string;
  organizationId: string;
  organizationName: string | null;
  routeName: string | null;
  tripDepartureAt: string;
  channel: BookingChannel;
  status: BookingStatus;
  fromSequence: number;
  toSequence: number;
  fromName: string;
  toName: string;
  plannedPickupAt: string;
  plannedDropoffAt: string;
  passengerCount: number;
  seats: string[];
  contactName: string;
  contactPhone: string;
  totalAmount: number;
  paymentNote: string;
  note: string | null;
  holdExpiresAt: string | null;
  decisionDueAt: string | null;
  cancelReason: string | null;
  cancelDeadline: string | null;
  canCancel: boolean;
  createdAt: string;
  version: number;
  tickets: BookingTicket[] | null;
  events:
    { action: string; actorId: string | null; note: string | null; createdAt: string }[] | null;
}

export interface SeatStateItem {
  label: string;
  isVip: boolean;
  isVieGo: boolean;
  deckNo: number;
  row: number;
  col: number;
  state: SeatState;
  price: number;
  bookingCode: string | null;
  contactName: string | null;
  channel: BookingChannel | null;
}

export interface SeatMap {
  tripId: string;
  fromSequence: number;
  toSequence: number;
  participationMode: string;
  vehiclePlate: string | null;
  seats: SeatStateItem[];
}

export interface BookingPolicy {
  organizationId: string;
  holdMinutes: number;
  decisionHours: number;
  decisionCutoffMinutes: number;
  salesCloseMinutes: number;
  cancelCutoffHours: number;
  isDefault: boolean;
  version: number;
}

export interface WalkInInput {
  fromSequence: number;
  toSequence: number;
  seats: string[];
  contactName: string;
  contactPhone: string;
  paymentNote: string;
  note: string;
}

export interface StopLike {
  sequence: number;
  name: string;
  allowPickup: boolean;
  allowDropoff: boolean;
}

export const bookingStatusLabels: Record<BookingStatus, string> = {
  Requested: 'Chờ duyệt',
  Held: 'Đang giữ chỗ',
  Confirmed: 'Đã xác nhận',
  Rejected: 'Đã từ chối',
  Expired: 'Hết hạn',
  Cancelled: 'Đã hủy',
  Completed: 'Hoàn thành',
};

export const bookingStatusTone: Record<BookingStatus, 'pending' | 'approved' | 'rejected'> = {
  Requested: 'pending',
  Held: 'pending',
  Confirmed: 'approved',
  Completed: 'approved',
  Rejected: 'rejected',
  Expired: 'rejected',
  Cancelled: 'rejected',
};

export const channelLabels: Record<BookingChannel, string> = {
  VieGo: 'VieGo',
  ShareLink: 'Link chia sẻ',
  Operator: 'Nhà xe nhập',
};

export const boardingLabels: Record<BookingTicket['boardingStatus'], string> = {
  NotBoarded: 'Chưa lên xe',
  Boarded: 'Đã lên xe',
  Alighted: 'Đã xuống',
  NoShow: 'Vắng',
};

export const activeStatuses: BookingStatus[] = ['Requested', 'Held', 'Confirmed'];

/** Điểm đón hợp lệ: cho đón và còn ít nhất một điểm trả phía sau. */
export function pickupStops<T extends StopLike>(stops: T[]): T[] {
  return stops.filter(
    (s) => s.allowPickup && stops.some((t) => t.allowDropoff && t.sequence > s.sequence),
  );
}

/** Điểm xuống hợp lệ sau điểm đón đã chọn. */
export function dropoffStops<T extends StopLike>(stops: T[], fromSequence: number): T[] {
  return stops.filter((s) => s.allowDropoff && s.sequence > fromSequence);
}

/** Đoạn mặc định: điểm đón đầu tiên → điểm trả cuối cùng (cả tuyến). */
export function defaultSegment(stops: StopLike[]): { from: number; to: number } | null {
  const from = pickupStops(stops)[0];
  if (!from) return null;
  const drops = dropoffStops(stops, from.sequence);
  const to = drops[drops.length - 1];
  return to ? { from: from.sequence, to: to.sequence } : null;
}

/** Giữ điểm xuống khi còn hợp lệ, nếu không chọn điểm trả cuối cùng sau điểm đón mới. */
export function adjustDropoff(stops: StopLike[], fromSequence: number, toSequence: number) {
  const drops = dropoffStops(stops, fromSequence);
  if (drops.some((s) => s.sequence === toSequence)) return toSequence;
  return drops.length ? drops[drops.length - 1].sequence : toSequence;
}

/** Lưới sơ đồ theo tầng từ danh sách ghế (hàng/cột lớn nhất). */
export function seatDecks(seats: SeatStateItem[]) {
  const decks = [...new Set(seats.map((s) => s.deckNo))].sort((a, b) => a - b);
  return decks.map((deckNo) => {
    const own = seats.filter((s) => s.deckNo === deckNo);
    return {
      deckNo,
      rows: Math.max(...own.map((s) => s.row)),
      columns: Math.max(...own.map((s) => s.col)),
      seats: own,
    };
  });
}

export function toggleSeat(picked: string[], label: string): string[] {
  return picked.includes(label) ? picked.filter((x) => x !== label) : [...picked, label];
}

/** Tổng tiền dự kiến cho các ghế đang chọn (giá theo đoạn, ghế Vip theo giá Vip). */
export function pickedTotal(seats: SeatStateItem[], picked: string[]): number {
  return seats.filter((s) => picked.includes(s.label)).reduce((sum, s) => sum + s.price, 0);
}

export function money(value: number): string {
  return value.toLocaleString('vi-VN') + ' đ';
}

/** Số ghế đã bán/giữ và số yêu cầu chờ duyệt — tóm tắt trên đầu mục Đặt chỗ. */
export function bookingSummary(bookings: Booking[]) {
  const active = bookings.filter((b) => b.status === 'Confirmed' || b.status === 'Held');
  return {
    seats: active.reduce((n, b) => n + b.seats.length, 0),
    confirmed: bookings.filter((b) => b.status === 'Confirmed').length,
    pending: bookings.filter((b) => b.status === 'Requested').length,
    revenue: bookings
      .filter((b) => b.status === 'Confirmed' || b.status === 'Completed')
      .reduce((n, b) => n + b.totalAmount, 0),
  };
}

export function validPhone(value: string): boolean {
  const phone = value.replace(/[\s.-]/g, '');
  const digits = phone.startsWith('+') ? phone.slice(1) : phone;
  return /^\d+$/.test(digits) && phone.length >= 9 && phone.length <= 15;
}
