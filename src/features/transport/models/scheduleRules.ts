import type {
  ParticipationMode,
  Registration,
  Schedule,
  ScheduleInput,
  Stop,
  StopInput,
} from './transport';
import { COACH, weekdayLabels } from './transport';

/** Ngày hôm nay theo giờ Việt Nam (UTC+7), dạng yyyy-MM-dd như Backend. */
export function vietnamToday(now = new Date()) {
  return new Date(now.getTime() + 7 * 3600_000).toISOString().slice(0, 10);
}

/** DaysOfWeek của Backend: 1 = Thứ 2 … 7 = Chủ nhật. */
export function formatDays(days: number[]) {
  if (days.length === 7) return 'Hằng ngày';
  return [...days]
    .sort((a, b) => a - b)
    .map((d) => weekdayLabels[d - 1] ?? '?')
    .join(', ');
}

/** Dịch vụ xe khách đang được phép khai thác (hoặc tạm ngưng: vẫn xem được dữ liệu cũ). */
export function coachAccess(registrations: Registration[] | null | undefined) {
  const coach = currentRegistration(registrations, COACH);
  return {
    registration: coach ?? null,
    canOperate: coach?.status === 'Approved',
    canView: coach?.status === 'Approved' || coach?.status === 'Suspended',
  };
}

/** Mỗi loại dịch vụ chỉ có một đăng ký chưa rút; nếu tất cả đã rút thì lấy bản mới nhất. */
export function currentRegistration(
  registrations: Registration[] | null | undefined,
  serviceTypeCode: string,
) {
  const matches = (registrations ?? []).filter((r) => r.serviceTypeCode === serviceTypeCode);
  return (
    matches.find((r) => r.status !== 'Withdrawn') ??
    [...matches].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0] ??
    null
  );
}

export function scheduleProblems(input: ScheduleInput): string[] {
  const problems: string[] = [];
  if (!input.routeId) problems.push('Chọn tuyến.');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.departureTime))
    problems.push('Giờ khởi hành dạng HH:mm.');
  if (!input.daysOfWeek.length) problems.push('Chọn ít nhất một ngày chạy trong tuần.');
  if (!input.effectiveFrom) problems.push('Chọn ngày bắt đầu hiệu lực.');
  if (input.effectiveTo && input.effectiveTo < input.effectiveFrom)
    problems.push('Ngày kết thúc phải sau ngày bắt đầu.');
  if (input.vieGoSeats.length && !input.plannedVehicleId)
    problems.push('Chọn xe dự kiến trước khi dành ghế cho VieGo.');
  if (input.participationMode === 'InstantBooking' && !input.vieGoSeats.length)
    problems.push('Đặt ngay cần xe dự kiến và ít nhất một ghế dành cho VieGo.');
  return problems;
}

export function emptySchedule(routeId = '', today = vietnamToday()): ScheduleInput {
  return {
    routeId,
    routeRevisionId: null,
    departureTime: '07:00',
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    effectiveFrom: today,
    effectiveTo: null,
    plannedVehicleId: null,
    participationMode: 'RequestConfirmation' as ParticipationMode,
    vieGoSeats: [],
  };
}

export function scheduleToInput(schedule: Schedule): ScheduleInput {
  return {
    routeId: schedule.routeId,
    routeRevisionId: schedule.routeRevisionId,
    departureTime: schedule.departureTime.slice(0, 5),
    daysOfWeek: [...schedule.daysOfWeek],
    effectiveFrom: schedule.effectiveFrom,
    effectiveTo: schedule.effectiveTo,
    plannedVehicleId: schedule.plannedVehicleId,
    participationMode: schedule.participationMode,
    vieGoSeats: [...schedule.vieGoSeats],
  };
}

/** Điều kiện công bố tuyến, khớp Backend RouteService.ValidateForPublish. */
export function publishProblems(stops: StopInput[]): string[] {
  const problems: string[] = [];
  if (stops.length < 2) problems.push('Tuyến cần ít nhất 2 điểm dừng.');
  if (stops.length && !stops[0].allowPickup) problems.push('Điểm đầu phải cho đón khách.');
  if (stops.length && !stops[stops.length - 1].allowDropoff)
    problems.push('Điểm cuối phải cho trả khách.');
  if (stops.length && stops[0].offsetMinutes !== 0) problems.push('Điểm đầu có thời gian 0 phút.');
  for (let i = 1; i < stops.length; i++)
    if (stops[i].offsetMinutes <= stops[i - 1].offsetMinutes)
      problems.push(`Điểm ${i + 1}: thời gian đến phải lớn hơn điểm trước.`);
  stops.forEach((stop, i) => {
    if (!stop.allowPickup && !stop.allowDropoff)
      problems.push(`Điểm ${i + 1}: phải cho đón, trả hoặc cả hai.`);
  });
  return problems;
}

export function stopsToInput(stops: Stop[] | null | undefined): StopInput[] {
  return (stops ?? []).map((stop) => ({
    sharedLocationId: stop.sharedLocationId,
    name: stop.name,
    addressDetail: stop.addressDetail,
    allowPickup: stop.allowPickup,
    allowDropoff: stop.allowDropoff,
    offsetMinutes: stop.offsetMinutes,
    dwellMinutes: stop.dwellMinutes,
  }));
}
