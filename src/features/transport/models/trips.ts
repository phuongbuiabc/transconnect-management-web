import type { ParticipationMode } from './transport';

export type TripStatus = 'Scheduled' | 'Departed' | 'Completed' | 'Cancelled';
export type CrewRole = 'Primary' | 'Secondary' | 'Attendant';
export type OrderStatus =
  'Issued' | 'Acknowledged' | 'DepartureConfirmed' | 'ArrivalConfirmed' | 'Revoked';

export interface TripCrew {
  driverId: string;
  name: string;
  role: CrewRole;
  assignedAt: string;
}

export interface TripStop {
  sequence: number;
  sharedLocationId: string;
  name: string;
  addressDetail: string;
  allowPickup: boolean;
  allowDropoff: boolean;
  plannedAt: string;
}

export interface TripEvent {
  action: string;
  actorId: string | null;
  note: string | null;
  createdAt: string;
}

export interface Trip {
  id: string;
  organizationId: string;
  routeId: string;
  routeCode: string;
  routeName: string;
  scheduleId: string | null;
  source: 'Schedule' | 'Manual';
  serviceDate: string;
  departureAt: string;
  plannedArrivalAt: string;
  participationMode: ParticipationMode;
  status: TripStatus;
  delayMinutes: number;
  delayReason: string | null;
  actualDepartedAt: string | null;
  actualCompletedAt: string | null;
  cancelKind: 'System' | 'Manual' | null;
  cancelReason: string | null;
  vehicleId: string | null;
  vehiclePlate: string | null;
  crew: TripCrew[];
  vieGoSeats: string[];
  order: { id: string; number: string; status: OrderStatus; publicCode: string } | null;
  version: number;
  stops?: TripStop[] | null;
  events?: TripEvent[] | null;
}

export interface TransportOrderEvent {
  sequence: number;
  action: string;
  actorKind: string;
  occurredAt: string;
  payloadJson: string;
  hash: string;
}

export interface TransportOrder {
  id: string;
  number: string;
  publicCode: string;
  status: OrderStatus;
  tripId: string;
  organizationName: string;
  snapshotJson: string;
  departurePassengerCount: number | null;
  arrivalPassengerCount: number | null;
  departureConfirmedAt: string | null;
  arrivalConfirmedAt: string | null;
  revokeReason: string | null;
  chainValid: boolean;
  version: number;
  events: TransportOrderEvent[];
  notice: string;
}

export interface OrderVerification {
  number: string;
  status: OrderStatus;
  organizationName: string;
  routeName: string;
  vehiclePlate: string;
  departureAt: string;
  departureConfirmedAt: string | null;
  arrivalConfirmedAt: string | null;
  eventCount: number;
  chainValid: boolean;
  notice: string;
}

export interface QuickTripInput {
  routeId: string;
  serviceDate: string;
  departureTime: string;
  participationMode: 'InformationOnly' | 'RequestConfirmation';
  vehicleId: string | null;
  primaryDriverId: string | null;
}

export interface CrewInput {
  primaryDriverId: string | null;
  secondaryDriverId: string | null;
  attendantDriverId: string | null;
}

export const tripStatusLabels: Record<TripStatus, string> = {
  Scheduled: 'Chờ chạy',
  Departed: 'Đang chạy',
  Completed: 'Hoàn thành',
  Cancelled: 'Đã hủy',
};

export const crewRoleLabels: Record<CrewRole, string> = {
  Primary: 'Tài xế chính',
  Secondary: 'Tài xế phụ',
  Attendant: 'Phụ xe',
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  Issued: 'Đã cấp, chờ tài xế nhận',
  Acknowledged: 'Tài xế đã nhận, chờ xuất bến',
  DepartureConfirmed: 'Bến đã xác nhận xuất bến',
  ArrivalConfirmed: 'Bến đã xác nhận đến bến',
  Revoked: 'Đã thu hồi',
};

export const tripActionLabels: Record<string, string> = {
  Generated: 'Sinh từ lịch',
  CreatedManual: 'Tạo chuyến nhanh',
  VehicleAssigned: 'Gán xe',
  VehicleUnassigned: 'Gỡ xe',
  CrewAssigned: 'Gán tổ lái',
  CrewEnded: 'Bỏ khỏi tổ lái',
  DelayReported: 'Báo trễ',
  Departed: 'Xuất bến',
  Completed: 'Kết thúc',
  Cancelled: 'Hủy chuyến',
  OrderIssued: 'Cấp lệnh vận chuyển',
  OrderRevoked: 'Thu hồi lệnh',
};

const VIETNAM_OFFSET = 7 * 3600_000;

/**
 * Backend trả giờ UTC; giá trị đọc lại từ SQL Server có thể thiếu hậu tố "Z".
 * Chuỗi không có múi giờ được hiểu là UTC, không phải giờ máy người dùng.
 */
export function parseUtc(value: string) {
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : value + 'Z');
}

/** "HH:mm" theo giờ Việt Nam. */
export function vietnamTime(value: string) {
  return new Date(parseUtc(value).getTime() + VIETNAM_OFFSET).toISOString().slice(11, 16);
}

/** "dd/MM HH:mm" theo giờ Việt Nam. */
export function vietnamDateTime(value: string) {
  const iso = new Date(parseUtc(value).getTime() + VIETNAM_OFFSET).toISOString();
  return iso.slice(8, 10) + '/' + iso.slice(5, 7) + ' ' + iso.slice(11, 16);
}

/** yyyy-MM-dd → "T4 02/12". */
export function serviceDateLabel(date: string) {
  const day = new Date(date + 'T00:00:00Z').getUTCDay();
  const names = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return names[day] + ' ' + date.slice(8, 10) + '/' + date.slice(5, 7);
}

export function addDays(date: string, days: number) {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function crewOf(trip: Trip, role: CrewRole) {
  return trip.crew.find((c) => c.role === role) ?? null;
}

/** Việc còn thiếu trước khi chuyến xuất bến được (theo quy tắc Backend). */
export function tripReadiness(trip: Trip): string[] {
  if (trip.status !== 'Scheduled') return [];
  const missing: string[] = [];
  if (!trip.vehicleId) missing.push('Chưa gán xe');
  if (!crewOf(trip, 'Primary')) missing.push('Chưa có tài xế chính');
  if (!trip.order) missing.push('Chưa cấp lệnh vận chuyển');
  else if (trip.order.status === 'Issued') missing.push('Tài xế chưa nhận lệnh');
  return missing;
}

/** Nhóm chuyến theo ngày chạy, giữ thứ tự giờ xuất bến. */
export function groupByDate(trips: Trip[]) {
  const groups = new Map<string, Trip[]>();
  for (const trip of [...trips].sort((a, b) => a.departureAt.localeCompare(b.departureAt))) {
    const list = groups.get(trip.serviceDate) ?? [];
    list.push(trip);
    groups.set(trip.serviceDate, list);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function quickTripProblems(input: QuickTripInput, today: string): string[] {
  const problems: string[] = [];
  if (!input.routeId) problems.push('Chọn tuyến.');
  if (!input.serviceDate || input.serviceDate < today) problems.push('Chọn ngày chạy từ hôm nay.');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.departureTime))
    problems.push('Giờ xuất bến dạng HH:mm.');
  return problems;
}

export function crewProblems(input: CrewInput): string[] {
  const chosen = [input.primaryDriverId, input.secondaryDriverId, input.attendantDriverId].filter(
    (x): x is string => !!x,
  );
  const problems: string[] = [];
  if (new Set(chosen).size !== chosen.length) problems.push('Một người chỉ giữ một vai trò.');
  if (!input.primaryDriverId && chosen.length) problems.push('Chọn tài xế chính trước.');
  return problems;
}

/** Đường dẫn trang kiểm tra công khai của lệnh (in thành QR khi in lệnh). */
export function verifyPath(publicCode: string) {
  return '/verify/' + encodeURIComponent(publicCode);
}
