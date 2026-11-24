import { useState } from 'react';
import { ErrorNotice, Loading } from '../../../shared/ui';
import { TripBookings } from '../../booking/components/TripBookings';
import { EmptyRecords } from '../../../shared/ui/RecordLayout';
import { tripsApi, type TripFilter } from '../api/tripsApi';
import { useTripDetail, useTrips } from '../hooks/useTransport';
import { vietnamToday } from '../models/scheduleRules';
import {
  addDays,
  crewOf,
  crewProblems,
  crewRoleLabels,
  groupByDate,
  orderStatusLabels,
  quickTripProblems,
  serviceDateLabel,
  tripActionLabels,
  tripReadiness,
  tripStatusLabels,
  verifyPath,
  vietnamDateTime,
  vietnamTime,
  type CrewInput,
  type QuickTripInput,
  type Trip,
  type TripStatus,
} from '../models/trips';
import { modeLabels, type TransportRoute } from '../models/transport';
import '../transport.css';

interface DriverOption {
  driverId: string;
  fullName: string;
}

interface VehicleOption {
  vehicleId: string;
  registrationPlate: string;
}

const tripTone: Record<TripStatus, string> = {
  Scheduled: 'pending',
  Departed: 'approved',
  Completed: 'approved',
  Cancelled: 'rejected',
};

function TripStatusBadge({ trip }: { trip: Trip }) {
  return (
    <>
      <span className={'status status-' + tripTone[trip.status]}>
        <span aria-hidden="true" />
        {tripStatusLabels[trip.status]}
      </span>
      {trip.delayMinutes > 0 && trip.status !== 'Cancelled' ? (
        <>
          <br />
          <small className="fare-missing">Trễ {trip.delayMinutes} phút</small>
        </>
      ) : null}
    </>
  );
}

/** Chuyến theo ngày: sinh từ lịch hoặc tạo nhanh; gán xe/tổ lái; cấp lệnh; theo dõi trạng thái (M3). */
export function TripsWorkspace({
  organizationId,
  canOperate,
  initialTripId = null,
}: {
  organizationId: string;
  canOperate: boolean;
  initialTripId?: string | null;
}) {
  const today = vietnamToday();
  const [filter, setFilter] = useState<TripFilter>({
    from: today,
    to: addDays(today, 6),
    routeId: '',
    status: '',
    unassigned: false,
  });
  const [selected, setSelected] = useState<string | null>(initialTripId);
  const [creating, setCreating] = useState(false);
  const state = useTrips(organizationId, filter);
  if (state.loading) return <Loading />;
  if (!state.data) return <ErrorNotice error={state.error} retry={state.reload} />;
  const data = state.data;
  const routes = data.routes.filter((r) => r.status === 'Active' && r.currentRevisionId);
  const shift = (days: number) =>
    setFilter({ ...filter, from: addDays(filter.from, days), to: addDays(filter.to, days) });

  if (selected)
    return (
      <TripDetail
        organizationId={organizationId}
        tripId={selected}
        canOperate={canOperate}
        vehicles={data.vehicles}
        drivers={data.drivers}
        onClose={() => {
          setSelected(null);
          state.reload();
        }}
      />
    );
  if (creating)
    return (
      <QuickTripForm
        routes={routes}
        vehicles={data.vehicles}
        drivers={data.drivers}
        today={today}
        busy={state.busy}
        error={state.error}
        onCancel={() => setCreating(false)}
        onSave={async (input) => {
          if (await state.mutate(() => tripsApi.createQuick(organizationId, input)))
            setCreating(false);
        }}
      />
    );

  return (
    <div className="partner-list">
      {state.error ? <ErrorNotice error={state.error} /> : null}
      <div className="trip-filters">
        <div className="partner-actions">
          <button type="button" className="button secondary" onClick={() => shift(-7)}>
            ‹ Tuần trước
          </button>
          <strong>
            {serviceDateLabel(filter.from)} – {serviceDateLabel(filter.to)}
          </strong>
          <button type="button" className="button secondary" onClick={() => shift(7)}>
            Tuần sau ›
          </button>
          {filter.from !== today ? (
            <button
              type="button"
              className="link-button"
              onClick={() => setFilter({ ...filter, from: today, to: addDays(today, 6) })}
            >
              Về hôm nay
            </button>
          ) : null}
        </div>
        <div className="form-row">
          <label>
            Tuyến
            <select
              value={filter.routeId}
              onChange={(e) => setFilter({ ...filter, routeId: e.target.value })}
            >
              <option value="">Tất cả tuyến</option>
              {data.routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} · {r.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Trạng thái
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              <option value="">Tất cả</option>
              {Object.entries(tripStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={filter.unassigned}
              onChange={(e) => setFilter({ ...filter, unassigned: e.target.checked })}
            />
            Chỉ chuyến thiếu xe hoặc tài xế chính
          </label>
        </div>
        {canOperate ? (
          <div className="partner-actions">
            <button
              type="button"
              className="button primary"
              disabled={!routes.length}
              onClick={() => setCreating(true)}
            >
              Tạo chuyến nhanh
            </button>
            <small>
              Chuyến theo lịch được sinh tự động 14 ngày tới; dùng chuyến nhanh cho chuyến tăng
              cường, chuyến bù hoặc ngày chạy lẻ.
            </small>
          </div>
        ) : null}
      </div>
      {data.trips.length === 0 ? (
        <EmptyRecords
          title="Không có chuyến trong khoảng này"
          description="Kích hoạt lịch chạy để hệ thống sinh chuyến, hoặc tạo chuyến nhanh."
        />
      ) : (
        groupByDate(data.trips).map(([date, trips]) => (
          <section key={date} className="trip-day">
            <h3>{serviceDateLabel(date)}</h3>
            <div className="table-scroll" tabIndex={0} role="region" aria-label={'Chuyến ' + date}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Giờ</th>
                    <th scope="col">Tuyến</th>
                    <th scope="col">Xe</th>
                    <th scope="col">Tổ lái</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col">
                      <span className="sr-only">Thao tác</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((trip) => {
                    const missing = tripReadiness(trip);
                    return (
                      <tr key={trip.id}>
                        <td>
                          <strong>{vietnamTime(trip.departureAt)}</strong>
                          <br />
                          <small>đến {vietnamTime(trip.plannedArrivalAt)}</small>
                        </td>
                        <td>
                          <strong>{trip.routeCode}</strong>
                          <br />
                          <small>
                            {trip.routeName}
                            {trip.source === 'Manual' ? ' · chuyến nhanh' : ''}
                          </small>
                        </td>
                        <td>
                          {canOperate && trip.status === 'Scheduled' ? (
                            <select
                              aria-label={'Xe cho chuyến ' + vietnamTime(trip.departureAt)}
                              value={trip.vehicleId ?? ''}
                              disabled={state.busy}
                              onChange={(e) =>
                                void state.mutate(() =>
                                  tripsApi.assignVehicle(
                                    organizationId,
                                    trip,
                                    e.target.value || null,
                                  ),
                                )
                              }
                            >
                              <option value="">Chưa gán</option>
                              {withCurrent(data.vehicles, trip).map((v) => (
                                <option key={v.vehicleId} value={v.vehicleId}>
                                  {v.registrationPlate}
                                </option>
                              ))}
                            </select>
                          ) : (
                            (trip.vehiclePlate ?? '—')
                          )}
                        </td>
                        <td>
                          {trip.crew.length
                            ? trip.crew.map((c) => (
                                <div key={c.driverId}>
                                  <small>{crewRoleLabels[c.role]}:</small> {c.name}
                                </div>
                              ))
                            : '—'}
                        </td>
                        <td>
                          <TripStatusBadge trip={trip} />
                          {missing.length ? (
                            <>
                              <br />
                              <small className="fare-missing">{missing.join(' · ')}</small>
                            </>
                          ) : null}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => setSelected(trip.id)}
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  );
}

/** Danh sách xe chọn được + xe đang gán (kể cả khi xe đó không còn trong danh sách lọc). */
function withCurrent(vehicles: VehicleOption[], trip: Trip): VehicleOption[] {
  if (!trip.vehicleId || vehicles.some((v) => v.vehicleId === trip.vehicleId)) return vehicles;
  return [
    { vehicleId: trip.vehicleId, registrationPlate: trip.vehiclePlate ?? '(xe hiện tại)' },
    ...vehicles,
  ];
}

function QuickTripForm({
  routes,
  vehicles,
  drivers,
  today,
  busy,
  error,
  onSave,
  onCancel,
}: {
  routes: TransportRoute[];
  vehicles: VehicleOption[];
  drivers: DriverOption[];
  today: string;
  busy: boolean;
  error: unknown;
  onSave: (input: QuickTripInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [input, setInput] = useState<QuickTripInput>({
    routeId: routes[0]?.id ?? '',
    serviceDate: today,
    departureTime: '',
    participationMode: 'RequestConfirmation',
    vehicleId: null,
    primaryDriverId: null,
  });
  const problems = quickTripProblems(input, today);
  const set = (change: Partial<QuickTripInput>) => setInput({ ...input, ...change });
  return (
    <form
      className="panel partner-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!problems.length) void onSave(input);
      }}
    >
      <h2>Tạo chuyến nhanh</h2>
      <p className="partner-meta">
        Chuyến lẻ không thuộc lịch lặp, dùng điểm dừng của bản tuyến đang công bố. Chưa cho đặt ngay
        vì chuyến lẻ chưa có ghế dành riêng cho VieGo.
      </p>
      {error ? <ErrorNotice error={error} /> : null}
      <div className="form-row">
        <label>
          1. Tuyến
          <select required value={input.routeId} onChange={(e) => set({ routeId: e.target.value })}>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code} · {r.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          2. Ngày chạy
          <input
            type="date"
            required
            min={today}
            value={input.serviceDate}
            onChange={(e) => set({ serviceDate: e.target.value })}
          />
        </label>
        <label>
          Giờ xuất bến
          <input
            type="time"
            required
            value={input.departureTime}
            onChange={(e) => set({ departureTime: e.target.value })}
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          3. Xe (tùy chọn)
          <select
            value={input.vehicleId ?? ''}
            onChange={(e) => set({ vehicleId: e.target.value || null })}
          >
            <option value="">Gán sau</option>
            {vehicles.map((v) => (
              <option key={v.vehicleId} value={v.vehicleId}>
                {v.registrationPlate}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tài xế chính (tùy chọn)
          <select
            value={input.primaryDriverId ?? ''}
            onChange={(e) => set({ primaryDriverId: e.target.value || null })}
          >
            <option value="">Gán sau</option>
            {drivers.map((d) => (
              <option key={d.driverId} value={d.driverId}>
                {d.fullName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Nhận khách
          <select
            value={input.participationMode}
            onChange={(e) =>
              set({ participationMode: e.target.value as QuickTripInput['participationMode'] })
            }
          >
            <option value="RequestConfirmation">{modeLabels.RequestConfirmation}</option>
            <option value="InformationOnly">{modeLabels.InformationOnly}</option>
          </select>
        </label>
      </div>
      {problems.length ? (
        <ul className="fare-missing">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      ) : null}
      <div className="partner-actions">
        <button className="button primary" disabled={busy || problems.length > 0}>
          Tạo chuyến
        </button>
        <button type="button" className="button secondary" onClick={onCancel}>
          Hủy
        </button>
      </div>
    </form>
  );
}

function TripDetail({
  organizationId,
  tripId,
  canOperate,
  vehicles,
  drivers,
  onClose,
}: {
  organizationId: string;
  tripId: string;
  canOperate: boolean;
  vehicles: VehicleOption[];
  drivers: DriverOption[];
  onClose: () => void;
}) {
  const state = useTripDetail(organizationId, tripId);
  const [reason, setReason] = useState('');
  const [delay, setDelay] = useState<{ minutes: string; reason: string } | null>(null);
  const [cancelling, setCancelling] = useState(false);
  if (state.loading) return <Loading />;
  if (!state.data) return <ErrorNotice error={state.error} retry={state.reload} />;
  const { trip, order } = state.data;
  const missing = tripReadiness(trip);
  const open = trip.status === 'Scheduled' || trip.status === 'Departed';
  const act = (fn: () => Promise<unknown>) => void state.mutate(fn);
  return (
    <div className="partner-list">
      <div className="partner-actions">
        <button type="button" className="button secondary" onClick={onClose}>
          ‹ Danh sách chuyến
        </button>
      </div>
      {state.error ? <ErrorNotice error={state.error} /> : null}
      <section className="panel">
        <h2>
          {trip.routeCode} · {serviceDateLabel(trip.serviceDate)} {vietnamTime(trip.departureAt)}
        </h2>
        <p className="partner-meta">
          {trip.routeName} · {modeLabels[trip.participationMode]} ·{' '}
          {trip.source === 'Manual' ? 'chuyến nhanh' : 'sinh từ lịch'}
        </p>
        <TripStatusBadge trip={trip} />
        {trip.delayReason ? <p>Lý do trễ: {trip.delayReason}</p> : null}
        {trip.cancelReason ? (
          <p>
            {trip.cancelKind === 'System' ? 'Hệ thống hủy' : 'Đã hủy'}: {trip.cancelReason}
          </p>
        ) : null}
        {missing.length ? (
          <p className="notice">Trước khi xuất bến: {missing.join(' · ')}.</p>
        ) : null}
        {trip.actualDepartedAt ? (
          <p>Xuất bến lúc {vietnamDateTime(trip.actualDepartedAt)}</p>
        ) : null}
        {trip.actualCompletedAt ? (
          <p>Kết thúc lúc {vietnamDateTime(trip.actualCompletedAt)}</p>
        ) : null}
        {canOperate && open ? (
          <div className="partner-actions">
            {trip.status === 'Scheduled' ? (
              <button
                type="button"
                className="button primary"
                disabled={state.busy || missing.length > 0}
                onClick={() => act(() => tripsApi.action(organizationId, trip, 'depart', ''))}
              >
                Xuất bến
              </button>
            ) : (
              <button
                type="button"
                className="button primary"
                disabled={state.busy}
                onClick={() => act(() => tripsApi.action(organizationId, trip, 'complete', ''))}
              >
                Kết thúc chuyến
              </button>
            )}
            <button
              type="button"
              className="button secondary"
              onClick={() =>
                setDelay({ minutes: String(trip.delayMinutes), reason: trip.delayReason ?? '' })
              }
            >
              Báo trễ
            </button>
            {trip.status === 'Scheduled' ? (
              <button
                type="button"
                className="button danger-outline"
                onClick={() => {
                  setReason('');
                  setCancelling(true);
                }}
              >
                Hủy chuyến
              </button>
            ) : null}
          </div>
        ) : null}
        {delay ? (
          <form
            className="inline-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await state.mutate(() =>
                tripsApi.delay(organizationId, trip, Number(delay.minutes) || 0, delay.reason),
              );
              if (ok) setDelay(null);
            }}
          >
            <label>
              Số phút trễ (0 = hết trễ)
              <input
                type="number"
                min={0}
                max={1440}
                value={delay.minutes}
                onChange={(e) => setDelay({ ...delay, minutes: e.target.value })}
              />
            </label>
            <label>
              Lý do
              <input
                value={delay.reason}
                maxLength={500}
                required={Number(delay.minutes) > 0}
                onChange={(e) => setDelay({ ...delay, reason: e.target.value })}
              />
            </label>
            <button className="button primary" disabled={state.busy}>
              Lưu
            </button>
            <button type="button" className="button secondary" onClick={() => setDelay(null)}>
              Đóng
            </button>
          </form>
        ) : null}
        {cancelling ? (
          <form
            className="inline-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await state.mutate(() =>
                tripsApi.action(organizationId, trip, 'cancel', reason),
              );
              if (ok) setCancelling(false);
            }}
          >
            <label>
              Lý do hủy
              <input
                required
                maxLength={1000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <button className="button danger" disabled={state.busy || !reason.trim()}>
              Xác nhận hủy
            </button>
            <button type="button" className="button secondary" onClick={() => setCancelling(false)}>
              Đóng
            </button>
          </form>
        ) : null}
      </section>

      <section className="panel">
        <h3>Xe và tổ lái</h3>
        <p>
          Xe: <strong>{trip.vehiclePlate ?? 'chưa gán'}</strong>
          {trip.vieGoSeats.length ? ' · ghế VieGo: ' + trip.vieGoSeats.join(', ') : ''}
        </p>
        {canOperate && trip.status === 'Scheduled' ? (
          <label>
            Đổi xe
            <select
              value={trip.vehicleId ?? ''}
              disabled={state.busy}
              onChange={(e) =>
                act(() => tripsApi.assignVehicle(organizationId, trip, e.target.value || null))
              }
            >
              <option value="">Chưa gán</option>
              {withCurrent(vehicles, trip).map((v) => (
                <option key={v.vehicleId} value={v.vehicleId}>
                  {v.registrationPlate}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {canOperate && open ? (
          <CrewForm
            key={trip.version}
            trip={trip}
            drivers={drivers}
            busy={state.busy}
            onSave={(crew) => act(() => tripsApi.assignCrew(organizationId, trip, crew))}
          />
        ) : (
          <ul>
            {trip.crew.map((c) => (
              <li key={c.driverId}>
                {crewRoleLabels[c.role]}: {c.name}
              </li>
            ))}
          </ul>
        )}
        <p className="partner-meta">
          Đổi xe hoặc tài xế chính khi đã cấp lệnh sẽ thu hồi lệnh; cấp lại lệnh mới sau đó.
        </p>
      </section>

      <section className="panel">
        <h3>Lệnh vận chuyển (mô phỏng)</h3>
        {order && order.status !== 'Revoked' ? (
          <>
            <p>
              Số lệnh <strong>{order.number}</strong> · {orderStatusLabels[order.status]}
            </p>
            <p>
              Chuỗi ghi nhận:{' '}
              {order.chainValid ? (
                <span className="status status-approved">
                  <span aria-hidden="true" />
                  Toàn vẹn
                </span>
              ) : (
                <span className="status status-rejected">
                  <span aria-hidden="true" />
                  Phát hiện sai lệch
                </span>
              )}{' '}
              · <a href={verifyPath(order.publicCode)}>Trang kiểm tra công khai</a>
            </p>
            {order.departurePassengerCount !== null ? (
              <p>
                Bến xác nhận xuất bến: {order.departurePassengerCount} khách
                {order.departureConfirmedAt
                  ? ' lúc ' + vietnamDateTime(order.departureConfirmedAt)
                  : ''}
              </p>
            ) : null}
            {order.arrivalPassengerCount !== null ? (
              <p>Bến xác nhận đến bến: {order.arrivalPassengerCount} khách</p>
            ) : null}
            <ol className="transport-history">
              {order.events.map((e) => (
                <li key={e.sequence}>
                  {vietnamDateTime(e.occurredAt)} · {e.action} ({e.actorKind}) ·{' '}
                  <code title={e.hash}>{e.hash.slice(0, 12)}…</code>
                </li>
              ))}
            </ol>
            {canOperate && (order.status === 'Issued' || order.status === 'Acknowledged') ? (
              <form
                className="inline-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (
                    await state.mutate(() =>
                      tripsApi.revokeOrder(organizationId, trip.id, order, reason),
                    )
                  )
                    setReason('');
                }}
              >
                <label>
                  Lý do thu hồi
                  <input
                    value={reason}
                    maxLength={1000}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                <button className="button danger-outline" disabled={state.busy || !reason.trim()}>
                  Thu hồi lệnh
                </button>
              </form>
            ) : null}
          </>
        ) : (
          <>
            <p>
              {order?.status === 'Revoked'
                ? 'Lệnh ' +
                  order.number +
                  ' đã thu hồi' +
                  (order.revokeReason ? ': ' + order.revokeReason : '') +
                  '.'
                : 'Chưa cấp lệnh.'}
            </p>
            {canOperate && trip.status === 'Scheduled' ? (
              <button
                type="button"
                className="button primary"
                disabled={state.busy || !trip.vehicleId || !crewOf(trip, 'Primary')}
                onClick={() => act(() => tripsApi.issueOrder(organizationId, trip.id))}
              >
                Cấp lệnh vận chuyển
              </button>
            ) : null}
          </>
        )}
        <p className="partner-meta">
          {order?.notice ??
            'Bản mô phỏng lệnh vận chuyển của VieGo, không thay lệnh vận chuyển điện tử theo quy định.'}
        </p>
      </section>

      <section className="panel">
        <h3>Đặt chỗ</h3>
        <TripBookings
          key={trip.id + ':' + trip.version}
          organizationId={organizationId}
          tripId={trip.id}
          stops={trip.stops ?? []}
          canOperate={canOperate}
          tripOpen={trip.status === 'Scheduled'}
        />
      </section>

      <section className="panel">
        <h3>Điểm dừng</h3>
        <ol className="route-stops">
          {(trip.stops ?? []).map((s) => (
            <li key={s.sequence}>
              <strong>{vietnamTime(s.plannedAt)}</strong> {s.name}
              <small>
                {' '}
                · {s.allowPickup ? 'đón' : ''}
                {s.allowPickup && s.allowDropoff ? '/' : ''}
                {s.allowDropoff ? 'trả' : ''}
              </small>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel">
        <h3>Lịch sử chuyến</h3>
        <ol className="transport-history">
          {(trip.events ?? []).map((e, i) => (
            <li key={i}>
              {vietnamDateTime(e.createdAt)} · {tripActionLabels[e.action] ?? e.action}
              {e.note ? ' — ' + e.note : ''}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function CrewForm({
  trip,
  drivers,
  busy,
  onSave,
}: {
  trip: Trip;
  drivers: DriverOption[];
  busy: boolean;
  onSave: (crew: CrewInput) => void;
}) {
  const [crew, setCrew] = useState<CrewInput>({
    primaryDriverId: crewOf(trip, 'Primary')?.driverId ?? null,
    secondaryDriverId: crewOf(trip, 'Secondary')?.driverId ?? null,
    attendantDriverId: crewOf(trip, 'Attendant')?.driverId ?? null,
  });
  const options = [...drivers];
  for (const c of trip.crew)
    if (!options.some((d) => d.driverId === c.driverId))
      options.push({ driverId: c.driverId, fullName: c.name });
  const problems = crewProblems(crew);
  const field = (key: keyof CrewInput, label: string) => (
    <label>
      {label}
      <select
        value={crew[key] ?? ''}
        onChange={(e) => setCrew({ ...crew, [key]: e.target.value || null })}
      >
        <option value="">—</option>
        {options.map((d) => (
          <option key={d.driverId} value={d.driverId}>
            {d.fullName}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <form
      className="partner-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!problems.length) onSave(crew);
      }}
    >
      <div className="form-row">
        {field('primaryDriverId', crewRoleLabels.Primary)}
        {field('secondaryDriverId', crewRoleLabels.Secondary)}
        {field('attendantDriverId', crewRoleLabels.Attendant)}
      </div>
      {problems.length ? <p className="fare-missing">{problems.join(' ')}</p> : null}
      {!drivers.length ? (
        <p className="partner-meta">Chưa có tài xế cộng tác. Mời tài xế ở mục Tài xế.</p>
      ) : null}
      <button className="button primary" disabled={busy || problems.length > 0}>
        Lưu tổ lái
      </button>
    </form>
  );
}
