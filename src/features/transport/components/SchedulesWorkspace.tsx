import { useState } from 'react';
import { ErrorNotice, Loading } from '../../../shared/ui';
import { EmptyRecords } from '../../../shared/ui/RecordLayout';
import type { Vehicle } from '../../foundation/models/foundation';
import { transportApi } from '../api/transportApi';
import { tripsApi } from '../api/tripsApi';
import { useSchedules } from '../hooks/useTransport';
import {
  emptySchedule,
  formatDays,
  scheduleProblems,
  scheduleToInput,
  vietnamToday,
} from '../models/scheduleRules';
import {
  modeLabels,
  weekdayLabels,
  type ParticipationMode,
  type Schedule,
  type ScheduleInput,
  type SeatLayout,
  type TransportRoute,
  type VehicleSeatLayout,
} from '../models/transport';
import { SeatGrid } from './SeatGrid';
import { TransportStatus } from './TransportStatus';
import '../transport.css';

type Form =
  | { kind: 'create'; input: ScheduleInput }
  | { kind: 'edit'; schedule: Schedule; input: ScheduleInput }
  | { kind: 'replace'; schedule: Schedule; input: ScheduleInput; fromDate: string };

/** Lịch chạy định kỳ theo tuyến đã công bố; lịch đang chạy chỉ thay bằng lịch mới từ một ngày. */
export function SchedulesWorkspace({
  organizationId,
  canOperate,
}: {
  organizationId: string;
  canOperate: boolean;
}) {
  const state = useSchedules(organizationId);
  const [form, setForm] = useState<Form | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    schedule: Schedule;
    action: 'pause' | 'end';
  } | null>(null);
  const [reason, setReason] = useState('');
  if (state.loading) return <Loading />;
  if (!state.data) return <ErrorNotice error={state.error} retry={state.reload} />;
  const data = state.data;
  const runnableRoutes = data.routes.filter((r) => r.status === 'Active' && r.currentRevisionId);
  if (form)
    return (
      <ScheduleForm
        form={form}
        routes={form.kind === 'create' ? runnableRoutes : data.routes}
        vehicles={data.vehicles}
        attached={data.attached}
        layouts={data.layouts}
        busy={state.busy}
        error={state.error}
        onCancel={() => setForm(null)}
        onSave={async (next) => {
          const ok = await state.mutate(() =>
            next.kind === 'create'
              ? transportApi.createSchedule(organizationId, next.input)
              : next.kind === 'edit'
                ? transportApi.updateSchedule(organizationId, next.schedule, next.input)
                : transportApi.replaceSchedule(
                    organizationId,
                    next.schedule,
                    next.fromDate,
                    next.input,
                  ),
          );
          if (ok) setForm(null);
        }}
      />
    );
  return (
    <div className="partner-list">
      {state.error ? <ErrorNotice error={state.error} /> : null}
      {canOperate ? (
        <div className="partner-actions">
          <button
            type="button"
            className="button primary"
            disabled={!runnableRoutes.length}
            onClick={() =>
              setForm({ kind: 'create', input: emptySchedule(runnableRoutes[0]?.id ?? '') })
            }
          >
            Tạo lịch chạy
          </button>
          {!runnableRoutes.length ? (
            <small>Cần ít nhất một tuyến đang hoạt động đã công bố.</small>
          ) : null}
        </div>
      ) : (
        <p className="notice">
          Dịch vụ xe khách chưa được duyệt hoặc đang tạm ngưng: chưa thể tạo hoặc kích hoạt lịch.
        </p>
      )}
      {data.schedules.length === 0 ? (
        <EmptyRecords
          title="Chưa có lịch chạy"
          description="Tạo lịch định kỳ cho tuyến đã công bố."
        />
      ) : (
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Danh sách lịch chạy">
          <table>
            <thead>
              <tr>
                <th scope="col">Tuyến</th>
                <th scope="col">Giờ chạy</th>
                <th scope="col">Hiệu lực</th>
                <th scope="col">Xe / ghế VieGo</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.schedules.map((schedule) => (
                <tr key={schedule.id}>
                  <td>
                    <strong>{schedule.routeCode}</strong>
                    <br />
                    <small>
                      {schedule.routeName} · bản {schedule.revisionNo}
                    </small>
                  </td>
                  <td>
                    {schedule.departureTime}
                    <br />
                    <small>{formatDays(schedule.daysOfWeek)}</small>
                  </td>
                  <td>
                    {formatDate(schedule.effectiveFrom)} →{' '}
                    {schedule.effectiveTo ? formatDate(schedule.effectiveTo) : 'không thời hạn'}
                  </td>
                  <td>
                    {schedule.plannedVehiclePlate ?? 'Chưa chọn xe'}
                    <br />
                    <small>
                      {modeLabels[schedule.participationMode]}
                      {schedule.vieGoSeats.length
                        ? ' · ' +
                          schedule.vieGoSeats.length +
                          ' ghế: ' +
                          schedule.vieGoSeats.join(', ')
                        : ''}
                    </small>
                  </td>
                  <td>
                    <TransportStatus value={schedule.status} />
                    {schedule.statusReason ? (
                      <>
                        <br />
                        <small>{schedule.statusReason}</small>
                      </>
                    ) : null}
                    {!schedule.fareReady && schedule.status !== 'Ended' ? (
                      <>
                        <br />
                        <small className="fare-missing">
                          Chưa có bảng giá công bố cho bản tuyến {schedule.revisionNo}
                        </small>
                      </>
                    ) : null}
                  </td>
                  <td>
                    {canOperate || schedule.status !== 'Ended' ? (
                      <div className="partner-actions">
                        {canOperate && schedule.status === 'Draft' ? (
                          <>
                            <button
                              type="button"
                              className="button secondary"
                              onClick={() =>
                                setForm({
                                  kind: 'edit',
                                  schedule,
                                  input: { ...scheduleToInput(schedule), routeRevisionId: null },
                                })
                              }
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="button danger-outline"
                              disabled={state.busy}
                              onClick={() =>
                                void state.mutate(() =>
                                  transportApi.deleteSchedule(organizationId, schedule),
                                )
                              }
                            >
                              Xóa
                            </button>
                          </>
                        ) : null}
                        {canOperate &&
                        (schedule.status === 'Draft' || schedule.status === 'Paused') ? (
                          <button
                            type="button"
                            className="button primary"
                            disabled={state.busy}
                            onClick={() =>
                              void state.mutate(() =>
                                transportApi.scheduleAction(
                                  organizationId,
                                  schedule,
                                  'activate',
                                  '',
                                ),
                              )
                            }
                          >
                            Kích hoạt
                          </button>
                        ) : null}
                        {canOperate &&
                        (schedule.status === 'Active' || schedule.status === 'Paused') ? (
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() =>
                              setForm({
                                kind: 'replace',
                                schedule,
                                input: { ...scheduleToInput(schedule), routeRevisionId: null },
                                fromDate: nextDay(vietnamToday(), schedule.effectiveFrom),
                              })
                            }
                          >
                            Thay lịch
                          </button>
                        ) : null}
                        {canOperate && schedule.status === 'Active' ? (
                          <button
                            type="button"
                            className="button secondary"
                            disabled={state.busy}
                            title="Sinh chuyến cho 14 ngày tới; ngày đã có chuyến được bỏ qua"
                            onClick={() =>
                              void state.mutate(() =>
                                tripsApi.generate(organizationId, schedule.id),
                              )
                            }
                          >
                            Sinh chuyến ngay
                          </button>
                        ) : null}
                        {schedule.status === 'Active' ? (
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => {
                              setReason('');
                              setStatusTarget({ schedule, action: 'pause' });
                            }}
                          >
                            Tạm dừng
                          </button>
                        ) : null}
                        {schedule.status === 'Active' || schedule.status === 'Paused' ? (
                          <button
                            type="button"
                            className="button danger-outline"
                            onClick={() => {
                              setReason('');
                              setStatusTarget({ schedule, action: 'end' });
                            }}
                          >
                            Kết thúc
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {statusTarget ? (
        <form
          className="panel partner-form"
          onSubmit={(e) => {
            e.preventDefault();
            void state
              .mutate(() =>
                transportApi.scheduleAction(
                  organizationId,
                  statusTarget.schedule,
                  statusTarget.action,
                  reason.trim(),
                ),
              )
              .then((ok) => ok && setStatusTarget(null));
          }}
        >
          <h3>
            {statusTarget.action === 'pause' ? 'Tạm dừng' : 'Kết thúc'} lịch{' '}
            {statusTarget.schedule.routeCode} {statusTarget.schedule.departureTime}
          </h3>
          <label>
            Lý do (không bắt buộc)
            <input maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          {statusTarget.action === 'end' ? (
            <p className="notice">Lịch đã kết thúc không thể kích hoạt lại.</p>
          ) : null}
          <div className="partner-actions">
            <button
              className={'button ' + (statusTarget.action === 'end' ? 'danger' : 'primary')}
              disabled={state.busy}
            >
              Xác nhận
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => setStatusTarget(null)}
            >
              Hủy
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function ScheduleForm({
  form,
  routes,
  vehicles,
  attached,
  layouts,
  busy,
  error,
  onSave,
  onCancel,
}: {
  form: Form;
  routes: TransportRoute[];
  vehicles: Vehicle[];
  attached: VehicleSeatLayout[];
  layouts: SeatLayout[];
  busy: boolean;
  error: unknown;
  onSave: (form: Form) => Promise<void>;
  onCancel: () => void;
}) {
  const [input, setInput] = useState<ScheduleInput>(form.input);
  const [fromDate, setFromDate] = useState(form.kind === 'replace' ? form.fromDate : '');
  const effective =
    form.kind === 'replace' ? { ...input, effectiveFrom: fromDate || input.effectiveFrom } : input;
  const problems = scheduleProblems(effective);
  const vehicleLayout = attached.find((a) => a.vehicleId === input.plannedVehicleId);
  const layout = layouts.find((l) => l.id === vehicleLayout?.layoutId) ?? null;
  const set = (change: Partial<ScheduleInput>) => setInput({ ...input, ...change });
  return (
    <form
      className="panel partner-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (problems.length) return;
        void onSave(
          form.kind === 'replace'
            ? { ...form, input: effective, fromDate }
            : ({ ...form, input } as Form),
        );
      }}
    >
      <h2>
        {form.kind === 'create'
          ? 'Lịch chạy mới'
          : form.kind === 'edit'
            ? 'Sửa lịch nháp'
            : 'Thay lịch ' + form.schedule.routeCode + ' ' + form.schedule.departureTime}
      </h2>
      {form.kind === 'replace' ? (
        <p className="partner-meta">
          Lịch cũ kết thúc vào ngày trước ngày áp dụng; lịch mới dùng bản tuyến đang công bố và
          {form.schedule.status === 'Active' ? ' được kích hoạt ngay.' : ' giữ trạng thái nháp.'}
        </p>
      ) : (
        <p className="partner-meta">
          Lịch dùng bản tuyến đang công bố tại thời điểm lưu. Lịch nháp chưa hiển thị với khách.
        </p>
      )}
      <div className="form-row">
        <label>
          Tuyến
          <select
            required
            disabled={form.kind === 'replace'}
            value={input.routeId}
            onChange={(e) => set({ routeId: e.target.value })}
          >
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.code} · {route.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Giờ khởi hành
          <input
            type="time"
            required
            value={input.departureTime}
            onChange={(e) => set({ departureTime: e.target.value })}
          />
        </label>
      </div>
      <fieldset>
        <legend>Ngày chạy trong tuần</legend>
        <div className="weekday-picker">
          {weekdayLabels.map((label, index) => {
            const day = index + 1;
            return (
              <label key={day} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={input.daysOfWeek.includes(day)}
                  onChange={(e) =>
                    set({
                      daysOfWeek: e.target.checked
                        ? [...input.daysOfWeek, day].sort((a, b) => a - b)
                        : input.daysOfWeek.filter((d) => d !== day),
                    })
                  }
                />
                {label}
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="form-row">
        {form.kind === 'replace' ? (
          <label>
            Áp dụng lịch mới từ ngày
            <input
              type="date"
              required
              min={vietnamToday()}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </label>
        ) : (
          <label>
            Hiệu lực từ
            <input
              type="date"
              required
              value={input.effectiveFrom}
              onChange={(e) => set({ effectiveFrom: e.target.value })}
            />
          </label>
        )}
        <label>
          Hiệu lực đến (để trống nếu không thời hạn)
          <input
            type="date"
            value={input.effectiveTo ?? ''}
            onChange={(e) => set({ effectiveTo: e.target.value || null })}
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          Xe dự kiến
          <select
            value={input.plannedVehicleId ?? ''}
            onChange={(e) => set({ plannedVehicleId: e.target.value || null, vieGoSeats: [] })}
          >
            <option value="">Chưa chọn</option>
            {vehicles.map((vehicle) => {
              const link = attached.find((a) => a.vehicleId === vehicle.vehicleId);
              return (
                <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
                  {vehicle.registrationPlate}
                  {link ? ' · ' + link.layoutName : ' · chưa gắn sơ đồ'}
                </option>
              );
            })}
          </select>
        </label>
        <label>
          Hình thức nhận khách qua VieGo
          <select
            value={input.participationMode}
            onChange={(e) => set({ participationMode: e.target.value as ParticipationMode })}
          >
            {Object.entries(modeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {input.plannedVehicleId ? (
        layout ? (
          <div>
            <p className="partner-meta">
              Chọn ghế dành cho VieGo bán ({input.vieGoSeats.length} ghế đã chọn). Các ghế còn lại
              nhà xe tự bán.
            </p>
            <SeatGrid
              grid={layout}
              mode="pick"
              picked={input.vieGoSeats}
              onCell={(cell) => {
                const label = cell.label ?? '';
                set({
                  vieGoSeats: input.vieGoSeats.includes(label)
                    ? input.vieGoSeats.filter((s) => s !== label)
                    : [...input.vieGoSeats, label],
                });
              }}
            />
          </div>
        ) : (
          <p className="notice">Xe chưa gắn sơ đồ ghế nên chưa thể dành ghế cho VieGo.</p>
        )
      ) : null}
      {problems.length ? (
        <div className="notice">
          <ul>
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {error ? <ErrorNotice error={error} /> : null}
      <div className="partner-actions">
        <button className="button primary" disabled={busy || problems.length > 0}>
          {busy ? 'Đang lưu…' : form.kind === 'replace' ? 'Tạo lịch thay thế' : 'Lưu lịch nháp'}
        </button>
        <button type="button" className="button secondary" onClick={onCancel}>
          Hủy
        </button>
      </div>
    </form>
  );
}

function formatDate(value: string) {
  const [y, m, d] = value.split('-');
  return d + '/' + m + '/' + y;
}

/** Ngày áp dụng mặc định: hôm nay, nhưng phải sau ngày bắt đầu của lịch cũ. */
function nextDay(today: string, effectiveFrom: string) {
  if (today > effectiveFrom) return today;
  const date = new Date(effectiveFrom + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
