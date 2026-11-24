import { useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { ErrorNotice, Loading } from '../../../shared/ui';
import { EmptyRecords, PageHeader } from '../../../shared/ui/RecordLayout';
import { tripsApi } from '../api/tripsApi';
import { useAdminTrips, useOrderVerification, useStationOrder } from '../hooks/useTransport';
import { vietnamToday } from '../models/scheduleRules';
import {
  addDays,
  crewRoleLabels,
  groupByDate,
  orderStatusLabels,
  serviceDateLabel,
  tripStatusLabels,
  vietnamDateTime,
  vietnamTime,
} from '../models/trips';
import '../transport.css';

/** Admin: xem chuyến của mọi nhà xe theo khoảng ngày (chỉ đọc). */
export function AdminTripsPage() {
  const today = vietnamToday();
  const [from, setFrom] = useState(today);
  const [status, setStatus] = useState('');
  const to = addDays(from, 6);
  const state = useAdminTrips(from, to, status);
  return (
    <>
      <PageHeader
        title="Chuyến"
        description="Theo dõi chuyến của các đơn vị vận tải; thao tác do nhà xe thực hiện."
      />
      <div className="partner-actions">
        <button
          type="button"
          className="button secondary"
          onClick={() => setFrom(addDays(from, -7))}
        >
          ‹ Tuần trước
        </button>
        <strong>
          {serviceDateLabel(from)} – {serviceDateLabel(to)}
        </strong>
        <button
          type="button"
          className="button secondary"
          onClick={() => setFrom(addDays(from, 7))}
        >
          Tuần sau ›
        </button>
        <label>
          Trạng thái{' '}
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tất cả</option>
            {Object.entries(tripStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {state.loading ? (
        <Loading />
      ) : !state.data ? (
        <ErrorNotice error={state.error} retry={state.reload} />
      ) : state.data.length === 0 ? (
        <EmptyRecords
          title="Không có chuyến"
          description="Không có chuyến trong khoảng ngày này."
        />
      ) : (
        groupByDate(state.data).map(([date, trips]) => (
          <section key={date} className="trip-day">
            <h3>{serviceDateLabel(date)}</h3>
            <div className="table-scroll" tabIndex={0} role="region" aria-label={'Chuyến ' + date}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Giờ</th>
                    <th scope="col">Tuyến</th>
                    <th scope="col">Xe / tổ lái</th>
                    <th scope="col">Lệnh</th>
                    <th scope="col">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((t) => (
                    <tr key={t.id}>
                      <td>{vietnamTime(t.departureAt)}</td>
                      <td>
                        <strong>{t.routeCode}</strong>
                        <br />
                        <small>{t.routeName}</small>
                      </td>
                      <td>
                        {t.vehiclePlate ?? '—'}
                        {t.crew.map((c) => (
                          <div key={c.driverId}>
                            <small>
                              {crewRoleLabels[c.role]}: {c.name}
                            </small>
                          </div>
                        ))}
                      </td>
                      <td>
                        {t.order ? (
                          <>
                            {t.order.number}
                            <br />
                            <small>{orderStatusLabels[t.order.status]}</small>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        {tripStatusLabels[t.status]}
                        {t.delayMinutes > 0 ? <small> · trễ {t.delayMinutes}′</small> : null}
                        {t.cancelReason ? (
                          <>
                            <br />
                            <small>{t.cancelReason}</small>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </>
  );
}

/** Bến xe mô phỏng: tra lệnh theo số, xác nhận xuất bến / đến bến kèm số khách. */
export function StationPage() {
  const [query, setQuery] = useState('');
  const [number, setNumber] = useState('');
  const [count, setCount] = useState('');
  const state = useStationOrder(number);
  const order = state.data;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setNumber(query.trim().toUpperCase());
  };
  const step =
    order?.status === 'Acknowledged'
      ? ('confirm-departure' as const)
      : order?.status === 'DepartureConfirmed'
        ? ('confirm-arrival' as const)
        : null;
  return (
    <>
      <PageHeader
        title="Bến xe (mô phỏng)"
        description="Vai trò bến xe trong bản mô phỏng lệnh vận chuyển: xác nhận xe xuất bến và đến bến."
      />
      <form className="inline-form" onSubmit={submit}>
        <label>
          Số lệnh
          <input
            required
            placeholder="LVC-2026-XXXXXX-000001"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <button className="button primary">Tra cứu</button>
      </form>
      {!number ? null : state.loading ? (
        <Loading />
      ) : !order ? (
        <ErrorNotice error={state.error} retry={state.reload} />
      ) : (
        <section className="panel">
          {state.error ? <ErrorNotice error={state.error} /> : null}
          <h2>{order.number}</h2>
          <p>
            {order.organizationName} · {orderStatusLabels[order.status]} · chuỗi ghi nhận{' '}
            {order.chainValid ? 'toàn vẹn' : 'PHÁT HIỆN SAI LỆCH'}
          </p>
          <OrderSnapshot json={order.snapshotJson} />
          {order.departurePassengerCount !== null ? (
            <p>Xuất bến: {order.departurePassengerCount} khách</p>
          ) : null}
          {order.arrivalPassengerCount !== null ? (
            <p>Đến bến: {order.arrivalPassengerCount} khách</p>
          ) : null}
          {step ? (
            <form
              className="inline-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (
                  await state.mutate(() => tripsApi.stationConfirm(order, step, Number(count) || 0))
                )
                  setCount('');
              }}
            >
              <label>
                Số khách thực tế
                <input
                  type="number"
                  min={0}
                  max={200}
                  required
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                />
              </label>
              <button className="button primary" disabled={state.busy}>
                {step === 'confirm-departure' ? 'Xác nhận xuất bến' : 'Xác nhận đến bến'}
              </button>
            </form>
          ) : order.status === 'Issued' ? (
            <p className="notice">Tài xế chính chưa nhận lệnh, chưa xác nhận xuất bến được.</p>
          ) : null}
          <ol className="transport-history">
            {order.events.map((e) => (
              <li key={e.sequence}>
                {vietnamDateTime(e.occurredAt)} · {e.action} ({e.actorKind}) ·{' '}
                <code title={e.hash}>{e.hash.slice(0, 12)}…</code>
              </li>
            ))}
          </ol>
          <p className="partner-meta">{order.notice}</p>
        </section>
      )}
    </>
  );
}

/** Ảnh chụp nội dung lệnh lúc cấp (tuyến, xe, giờ). Chỉ hiển thị các trường thường gặp. */
function OrderSnapshot({ json }: { json: string }) {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
  const rows = Object.entries(data).filter(
    ([, v]) => typeof v === 'string' || typeof v === 'number',
  );
  if (!rows.length) return null;
  return (
    <dl className="order-snapshot">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{String(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Trang công khai (quét QR): kiểm tra lệnh còn hiệu lực và chuỗi ghi nhận chưa bị sửa. */
export function OrderVerifyPage() {
  const { code = '' } = useParams();
  const state = useOrderVerification(code);
  return (
    <main className="center-page">
      <section className="recovery-card">
        <h1>Kiểm tra lệnh vận chuyển</h1>
        {state.loading ? (
          <Loading />
        ) : !state.data ? (
          <ErrorNotice error={state.error} />
        ) : (
          <>
            <p>
              <strong>{state.data.number}</strong>
            </p>
            <p>
              {state.data.organizationName} · {state.data.routeName} · xe {state.data.vehiclePlate}
            </p>
            <p>Giờ xuất bến dự kiến: {vietnamDateTime(state.data.departureAt)}</p>
            <p>Trạng thái: {orderStatusLabels[state.data.status]}</p>
            {state.data.departureConfirmedAt ? (
              <p>Bến xác nhận xuất bến: {vietnamDateTime(state.data.departureConfirmedAt)}</p>
            ) : null}
            {state.data.arrivalConfirmedAt ? (
              <p>Bến xác nhận đến bến: {vietnamDateTime(state.data.arrivalConfirmedAt)}</p>
            ) : null}
            <p>
              Chuỗi ghi nhận ({state.data.eventCount} sự kiện):{' '}
              <strong>{state.data.chainValid ? 'toàn vẹn' : 'phát hiện sai lệch'}</strong>
            </p>
            <p className="partner-meta">{state.data.notice}</p>
          </>
        )}
      </section>
    </main>
  );
}
