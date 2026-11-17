/** Contract của module Transport (M2). Tên field giữ đúng JSON của Backend. */
export const COACH = 'FIXED_ROUTE_COACH';

export const serviceTypeOptions = [
  { code: 'FIXED_ROUTE_COACH', label: 'Xe khách tuyến cố định' },
  { code: 'FREIGHT_TRUCK', label: 'Xe tải chở hàng / ghép hàng' },
  { code: 'CHARTER', label: 'Thuê nguyên xe / xe hợp đồng' },
] as const;

export function serviceTypeLabel(code: string) {
  return serviceTypeOptions.find((item) => item.code === code)?.label ?? code;
}

export type RegistrationStatus = 'Pending' | 'Approved' | 'Rejected' | 'Suspended' | 'Withdrawn';

export const registrationStatusLabels: Record<RegistrationStatus, string> = {
  Pending: 'Chờ duyệt',
  Approved: 'Đã duyệt',
  Rejected: 'Từ chối',
  Suspended: 'Tạm ngưng',
  Withdrawn: 'Đã rút',
};

export interface ServiceType {
  code: string;
  name: string;
  description: string;
  allowedModes: string[];
  isOperational: boolean;
}

export interface RegistrationEvent {
  id: string;
  action: string;
  status: RegistrationStatus;
  note: string | null;
  scopeNote: string | null;
  actorAccountId: string;
  createdAt: string;
}

export interface Registration {
  id: string;
  organizationId: string;
  organizationName: string | null;
  registrationNumber: string | null;
  serviceTypeCode: string;
  serviceTypeName: string;
  isOperational: boolean;
  status: RegistrationStatus;
  scopeNote: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  submittedAt: string;
  version: number;
  events?: RegistrationEvent[] | null;
}

export interface Stop {
  id: string;
  sequence: number;
  sharedLocationId: string;
  locationVersion: number;
  name: string;
  addressDetail: string;
  provinceCode: string;
  wardCode: string;
  latitude: number | null;
  longitude: number | null;
  allowPickup: boolean;
  allowDropoff: boolean;
  offsetMinutes: number;
  dwellMinutes: number | null;
}

export interface StopInput {
  sharedLocationId: string;
  name: string;
  addressDetail: string;
  allowPickup: boolean;
  allowDropoff: boolean;
  offsetMinutes: number;
  dwellMinutes: number | null;
}

export interface Revision {
  id: string;
  revisionNo: number;
  status: 'Draft' | 'Published' | 'Retired';
  note: string | null;
  createdAt: string;
  publishedAt: string | null;
  version: number;
  stopCount: number;
  stops?: Stop[] | null;
}

export interface TransportRoute {
  id: string;
  organizationId: string;
  serviceRegistrationId: string;
  code: string;
  name: string;
  status: 'Active' | 'Inactive';
  statusReason: string | null;
  currentRevisionId: string | null;
  currentRevisionNo: number | null;
  hasDraft: boolean;
  version: number;
  firstStopName: string | null;
  lastStopName: string | null;
}

export interface RouteDetail {
  route: TransportRoute;
  revisions: Revision[];
  current: Revision | null;
  draft: Revision | null;
}

export type CellType = 'Seat' | 'Aisle' | 'Empty' | 'Driver' | 'Door';
export type SeatClass = 'Standard' | 'Vip';
export type LayoutKind = 'Seater' | 'Sleeper' | 'Cabin';

export const layoutKindLabels: Record<LayoutKind, string> = {
  Seater: 'Ghế ngồi',
  Sleeper: 'Giường nằm',
  Cabin: 'Phòng / limousine',
};

export interface Deck {
  deckNo: number;
  rows: number;
  columns: number;
}

export interface Cell {
  deckNo: number;
  row: number;
  col: number;
  cellType: CellType;
  label: string | null;
  seatClass: SeatClass | null;
  isSellable: boolean;
}

export interface SeatLayout {
  id: string;
  organizationId: string | null;
  name: string;
  layoutKind: LayoutKind;
  deckCount: number;
  status: 'Draft' | 'Locked' | 'Archived';
  sourceLayoutId: string | null;
  version: number;
  seatCount: number;
  sellableCount: number;
  decks: Deck[];
  cells: Cell[];
  vehicleIds: string[];
}

export interface SeatLayoutInput {
  name: string;
  layoutKind: LayoutKind;
  decks: Deck[];
  cells: Cell[];
}

export interface VehicleSeatLayout {
  vehicleId: string;
  layoutId: string;
  layoutName: string;
  sellableCount: number;
  attachedAt: string;
}

export type ScheduleStatus = 'Draft' | 'Active' | 'Paused' | 'Ended';
export type ParticipationMode = 'InformationOnly' | 'RequestConfirmation' | 'InstantBooking';

export const scheduleStatusLabels: Record<ScheduleStatus, string> = {
  Draft: 'Nháp',
  Active: 'Đang chạy',
  Paused: 'Tạm dừng',
  Ended: 'Đã kết thúc',
};

export const modeLabels: Record<ParticipationMode, string> = {
  InformationOnly: 'Chỉ hiển thị thông tin',
  RequestConfirmation: 'Khách gửi yêu cầu, nhà xe xác nhận',
  InstantBooking: 'Đặt ngay (ghế dành cho VieGo)',
};

export const weekdayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export interface Schedule {
  id: string;
  routeId: string;
  routeCode: string;
  routeName: string;
  routeRevisionId: string;
  revisionNo: number;
  departureTime: string;
  daysOfWeek: number[];
  effectiveFrom: string;
  effectiveTo: string | null;
  plannedVehicleId: string | null;
  plannedVehiclePlate: string | null;
  sellableSeats: number | null;
  participationMode: ParticipationMode;
  vieGoSeats: string[];
  status: ScheduleStatus;
  statusReason: string | null;
  replacesScheduleId: string | null;
  version: number;
  /** false khi lịch nhận khách qua VieGo nhưng bản tuyến chưa có bảng giá công bố (Q-M2-FARE-010A). */
  fareReady: boolean;
}

export interface ScheduleInput {
  routeId: string;
  routeRevisionId: string | null;
  departureTime: string;
  daysOfWeek: number[];
  effectiveFrom: string;
  effectiveTo: string | null;
  plannedVehicleId: string | null;
  participationMode: ParticipationMode;
  vieGoSeats: string[];
}

export function formatOffset(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} giờ${rest ? ' ' + rest + ' phút' : ''}` : `${rest} phút`;
}

export type FareStatus = 'Draft' | 'Published' | 'Superseded';
export type FarePhase = 'Current' | 'Upcoming' | 'Past';

export interface FareStop {
  sharedLocationId: string;
  sequence: number;
  name: string;
  allowPickup: boolean;
  allowDropoff: boolean;
}

export interface FarePrice {
  fromLocationId: string;
  toLocationId: string;
  price: number;
  vipPrice: number | null;
  vipTotal: number;
}

export interface FareTable {
  id: string;
  routeId: string;
  routeRevisionId: string;
  revisionNo: number;
  tableNo: number;
  status: FareStatus;
  phase: FarePhase | null;
  effectiveFrom: string;
  vipSurcharge: number;
  note: string | null;
  createdAt: string;
  publishedAt: string | null;
  version: number;
  priceCount: number;
  pairCount: number;
  stops?: FareStop[] | null;
  prices?: FarePrice[] | null;
  warnings?: string[] | null;
}

export interface FareInput {
  effectiveFrom: string;
  vipSurcharge: number;
  note: string;
  prices: {
    fromLocationId: string;
    toLocationId: string;
    price: number;
    vipPrice: number | null;
  }[];
}

export function formatVnd(value: number) {
  return value.toLocaleString('vi-VN') + ' đ';
}
