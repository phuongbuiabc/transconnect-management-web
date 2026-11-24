import { useState } from 'react';
import { ErrorNotice, Loading } from '../../../shared/ui';
import { vietnamDateTime, vietnamTime } from '../../transport/models/trips';
import { bookingApi } from '../api/bookingApi';
import { useTripBookings } from '../hooks/useBooking';
import {
  activeStatuses,
  adjustDropoff,
  bookingStatusLabels,
  bookingStatusTone,
  bookingSummary,
  boardingLabels,
  channelLabels,
  defaultSegment,
  dropoffStops,
  money,
  pickedTotal,
  pickupStops,
  seatDecks,
  toggleSeat,
  validPhone,
  type Booking,
  type SeatStateItem,
  type StopLike,
} from '../models/booking';
import '../booking.css';

const seatStateLabels = { Available: 'Trống', Taken: 'Đã có khách', NotForSale: 'Không bán' };

/**
 * Mục "Đặt chỗ" trong chi tiết chuyến (M4a): sơ đồ ghế theo đoạn đón–xuống, nhập vé ngoài,
 * xếp ghế duyệt yêu cầu, danh sách đặt chỗ có tên + SĐT người đặt.
 */
export function TripBookings({
  organizationId,
  tripId,
  stops,
  canOperate,
  tripOpen,
}: {
  organizationId: string;
  tripId: string;
  stops: StopLike[];
  canOperate: boolean;
  tripOpen: boolean;
}) {
  const initial = defaultSegment(stops);
  const [segment, setSegment] = useState(initial ?? { from: 0, to: 0 });
  const [picked, setPicked] = useState<string[]>([]);
  const [approving, setApproving] = useState<Booking | null>(null);
  const [walkIn, setWalkIn] = useState({ name: '', phone: '', payment: '', note: '' });
  const [reasonFor, setReasonFor] = useState<{
    booking: Booking;
    kind: 'reject' | 'cancel';
  } | null>(null);
  const [reason, setReason] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'all'>('active');
  const state = useTripBookings(organizationId, tripId, segment.from, segment.to);

  if (!initial) return <p className="partner-meta">Chuyến không có đoạn đón – trả hợp lệ.</p>;
  if (state.loading) return <Loading />;
  if (!state.data) return <ErrorNotice error={state.error} retry={state.reload} />;
  const { bookings, map } = state.data;
  const seats = map?.seats ?? [];
  const summary = bookingSummary(bookings);
  const shown = bookings.filter((b) => statusFilter === 'all' || activeStatuses.includes(b.status));
  const pickups = pickupStops(stops);
  const drops = dropoffStops(stops, segment.from);
  const total = pickedTotal(seats, picked);
  const canPick = canOperate && tripOpen;

  const changeSegment = (from: number, to: number) => {
    setSegment({ from, to: adjustDropoff(stops, from, to) });
    setPicked([]);
  };
  const startApprove = (b: Booking) => {
    setApproving(b);
    setReasonFor(null);
    setSegment({ from: b.fromSequence, to: b.toSequence });
    setPicked([]);
  };
  const stopApprove = () => {
    setApproving(null);
    setPicked([]);
  };
  const pick = (s: SeatStateItem) => {
    if (s.state !== 'Available' || !canPick) return;
    setPicked(toggleSeat(picked, s.label));
  };

  const walkInValid =
    picked.length > 0 && walkIn.name.trim().length > 0 && validPhone(walkIn.phone);
  const approveValid = approving && picked.length === approving.passengerCount;

  return (
    <div className="booking-section">
      <p className="booking-summary">
        <strong>{summary.seats}</strong> ghế đã giữ/bán · <strong>{summary.confirmed}</strong> đặt
        chỗ đã xác nhận ·{' '}
        <strong className={summary.pending ? 'fare-missing' : ''}>{summary.pending}</strong> yêu cầu
        chờ duyệt · doanh thu dự kiến <strong>{money(summary.revenue)}</strong>
      </p>
      {state.error ? <ErrorNotice error={state.error} /> : null}

      <div className="inline-form">
        <label>
          Đón tại
          <select
            value={segment.from}
            disabled={!!approving}
            onChange={(e) => changeSegment(Number(e.target.value), segment.to)}
          >
            {pickups.map((s) => (
              <option key={s.sequence} value={s.sequence}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Xuống tại
          <select
            value={segment.to}
            disabled={!!approving}
            onChange={(e) => changeSegment(segment.from, Number(e.target.value))}
          >
            {drops.map((s) => (
              <option key={s.sequence} value={s.sequence}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {approving ? (
        <p className="notice">
          Xếp {approving.passengerCount} ghế cho yêu cầu <strong>{approving.code}</strong> của{' '}
          {approving.contactName} ({approving.fromName} → {approving.toName}). Đã chọn{' '}
          {picked.length}/{approving.passengerCount}.
        </p>
      ) : null}

      {!map ? (
        <p className="partner-meta">Chưa gán xe nên chưa có sơ đồ ghế.</p>
      ) : seats.length === 0 ? (
        <p className="partner-meta">Sơ đồ xe {map.vehiclePlate} không có ghế bán được.</p>
      ) : (
        <>
          <p className="partner-meta">
            Xe {map.vehiclePlate} · ghế "Đã có khách" là ghế bị chiếm trên ít nhất một chặng của
            đoạn đang xem. Viền vàng = VIP, chấm đỏ = ghế dành cho VieGo.
          </p>
          <div className="seat-decks">
            {seatDecks(seats).map((deck) => (
              <figure key={deck.deckNo} className="seat-deck">
                <figcaption>
                  {deck.deckNo === 1 ? 'Tầng dưới' : 'Tầng trên'}
                  <small> · đầu xe ở trên</small>
                </figcaption>
                <div
                  className="seat-grid"
                  style={{ gridTemplateColumns: `repeat(${deck.columns}, minmax(2.5rem, 1fr))` }}
                >
                  {deck.seats.map((s) => {
                    const isPicked = picked.includes(s.label);
                    const title =
                      `Ghế ${s.label}${s.isVip ? ' (VIP)' : ''} · ${seatStateLabels[s.state]} · ${money(s.price)}` +
                      (s.bookingCode ? ` · ${s.bookingCode} ${s.contactName ?? ''}` : '');
                    const className =
                      'seat-cell cell-seat booking-seat seat-' +
                      s.state.toLowerCase() +
                      (s.isVip ? ' is-vip' : '') +
                      (s.isVieGo ? ' is-viego' : '') +
                      (isPicked ? ' is-picked' : '');
                    const style = { gridRow: s.row, gridColumn: s.col };
                    return s.state === 'Available' && canPick ? (
                      <button
                        key={s.label}
                        type="button"
                        className={className}
                        style={style}
                        title={title}
                        aria-label={title}
                        aria-pressed={isPicked}
                        onClick={() => pick(s)}
                      >
                        {s.label}
                      </button>
                    ) : (
                      <span key={s.label} className={className} style={style} title={title}>
                        {s.label}
                        {s.state === 'Taken' && s.contactName ? (
                          <small>{s.contactName.split(' ').pop()}</small>
                        ) : null}
                      </span>
                    );
                  })}
                </div>
              </figure>
            ))}
          </div>
        </>
      )}

      {canPick && approving ? (
        <div className="partner-actions">
          <button
            type="button"
            className="button primary"
            disabled={state.busy || !approveValid}
            onClick={async () => {
              if (await state.mutate(() => bookingApi.approve(organizationId, approving, picked)))
                stopApprove();
            }}
          >
            Duyệt và giữ {picked.length} ghế · {money(total)}
          </button>
          <button type="button" className="button secondary" onClick={stopApprove}>
            Thôi
          </button>
        </div>
      ) : null}

      {canPick && !approving && picked.length > 0 ? (
        <form
          className="booking-walkin"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!walkInValid) return;
            const ok = await state.mutate(() =>
              bookingApi.walkIn(organizationId, tripId, {
                fromSequence: segment.from,
                toSequence: segment.to,
                seats: picked,
                contactName: walkIn.name.trim(),
                contactPhone: walkIn.phone.trim(),
                paymentNote: walkIn.payment.trim(),
                note: walkIn.note.trim(),
              }),
            );
            if (ok) {
              setPicked([]);
              setWalkIn({ name: '', phone: '', payment: '', note: '' });
            }
          }}
        >
          <h4>
            Vé ngoài (gọi điện / tại quầy) · ghế {picked.join(', ')} · {money(total)}
          </h4>
          <div className="inline-form">
            <label>
              Tên khách
              <input
                value={walkIn.name}
                maxLength={200}
                required
                onChange={(e) => setWalkIn({ ...walkIn, name: e.target.value })}
              />
            </label>
            <label>
              Số điện thoại
              <input
                value={walkIn.phone}
                inputMode="tel"
                maxLength={20}
                required
                onChange={(e) => setWalkIn({ ...walkIn, phone: e.target.value })}
              />
            </label>
            <label>
              Thanh toán
              <input
                value={walkIn.payment}
                maxLength={200}
                placeholder="Đã thu tại quầy / thu khi lên xe"
                onChange={(e) => setWalkIn({ ...walkIn, payment: e.target.value })}
              />
            </label>
            <label>
              Ghi chú
              <input
                value={walkIn.note}
                maxLength={500}
                onChange={(e) => setWalkIn({ ...walkIn, note: e.target.value })}
              />
            </label>
          </div>
          {walkIn.phone && !validPhone(walkIn.phone) ? (
            <p className="fare-missing">Số điện thoại 9–15 chữ số.</p>
          ) : null}
          <div className="partner-actions">
            <button className="button primary" disabled={state.busy || !walkInValid}>
              Xuất vé
            </button>
            <button type="button" className="button secondary" onClick={() => setPicked([])}>
              Bỏ chọn
            </button>
          </div>
        </form>
      ) : null}

      <div className="booking-list-head">
        <h4>Danh sách đặt chỗ</h4>
        <label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'active' | 'all')}
          >
            <option value="active">Còn hiệu lực</option>
            <option value="all">Tất cả</option>
          </select>
        </label>
      </div>
      {shown.length === 0 ? (
        <p className="partner-meta">Chưa có đặt chỗ.</p>
      ) : (
        <div className="table-scroll">
          <table className="booking-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Người đặt</th>
                <th>Đoạn</th>
                <th>Ghế</th>
                <th>Tiền</th>
                <th>Trạng thái</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  canAct={canOperate}
                  busy={state.busy}
                  approvingId={approving?.id ?? null}
                  onApprove={() => startApprove(b)}
                  onReason={(kind) => {
                    setReasonFor({ booking: b, kind });
                    setReason('');
                    stopApprove();
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reasonFor ? (
        <form
          className="inline-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const { booking, kind } = reasonFor;
            const ok = await state.mutate(() =>
              kind === 'reject'
                ? bookingApi.reject(organizationId, booking, reason.trim())
                : bookingApi.cancel(organizationId, booking, reason.trim()),
            );
            if (ok) setReasonFor(null);
          }}
        >
          <label>
            {reasonFor.kind === 'reject' ? 'Lý do từ chối ' : 'Lý do hủy '}
            {reasonFor.booking.code}
            <input
              value={reason}
              maxLength={1000}
              autoFocus
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <button className="button danger-outline" disabled={state.busy || !reason.trim()}>
            {reasonFor.kind === 'reject' ? 'Từ chối yêu cầu' : 'Hủy đặt chỗ'}
          </button>
          <button type="button" className="button secondary" onClick={() => setReasonFor(null)}>
            Thôi
          </button>
        </form>
      ) : null}
    </div>
  );
}

function BookingRow({
  booking: b,
  canAct,
  busy,
  approvingId,
  onApprove,
  onReason,
}: {
  booking: Booking;
  canAct: boolean;
  busy: boolean;
  approvingId: string | null;
  onApprove: () => void;
  onReason: (kind: 'reject' | 'cancel') => void;
}) {
  const [open, setOpen] = useState(false);
  const deadline =
    b.status === 'Requested' && b.decisionDueAt
      ? 'Hạn duyệt ' + vietnamDateTime(b.decisionDueAt)
      : b.status === 'Held' && b.holdExpiresAt
        ? 'Giữ tới ' + vietnamDateTime(b.holdExpiresAt)
        : null;
  return (
    <>
      <tr className={approvingId === b.id ? 'is-selected' : undefined}>
        <td>
          <button type="button" className="link-button" onClick={() => setOpen(!open)}>
            {b.code}
          </button>
          <br />
          <small>{channelLabels[b.channel]}</small>
        </td>
        <td>
          {b.contactName}
          <br />
          <a href={'tel:' + b.contactPhone}>{b.contactPhone}</a>
        </td>
        <td>
          {b.fromName} → {b.toName}
          <br />
          <small>
            {vietnamTime(b.plannedPickupAt)} – {vietnamTime(b.plannedDropoffAt)}
          </small>
        </td>
        <td>{b.seats.length ? b.seats.join(', ') : b.passengerCount + ' khách (chưa xếp)'}</td>
        <td>{money(b.totalAmount)}</td>
        <td>
          <span className={'status status-' + bookingStatusTone[b.status]}>
            <span aria-hidden="true" />
            {bookingStatusLabels[b.status]}
          </span>
          {deadline ? (
            <>
              <br />
              <small>{deadline}</small>
            </>
          ) : null}
        </td>
        <td className="booking-actions">
          {canAct && b.status === 'Requested' ? (
            <>
              <button type="button" className="button primary" disabled={busy} onClick={onApprove}>
                Xếp ghế
              </button>
              <button
                type="button"
                className="button danger-outline"
                disabled={busy}
                onClick={() => onReason('reject')}
              >
                Từ chối
              </button>
            </>
          ) : null}
          {canAct && (b.status === 'Held' || b.status === 'Confirmed') ? (
            <button
              type="button"
              className="button danger-outline"
              disabled={busy}
              onClick={() => onReason('cancel')}
            >
              Hủy
            </button>
          ) : null}
        </td>
      </tr>
      {open ? (
        <tr className="booking-detail">
          <td colSpan={7}>
            {b.note ? <p>Ghi chú: {b.note}</p> : null}
            <p>Thanh toán: {b.paymentNote}</p>
            {b.cancelReason ? <p>Lý do: {b.cancelReason}</p> : null}
            {b.tickets?.length ? (
              <p>
                Vé:{' '}
                {b.tickets
                  .map(
                    (t) => `${t.seatLabel} ${t.ticketCode} (${boardingLabels[t.boardingStatus]})`,
                  )
                  .join(' · ')}
              </p>
            ) : null}
            <p className="partner-meta">Đặt lúc {vietnamDateTime(b.createdAt)}</p>
          </td>
        </tr>
      ) : null}
    </>
  );
}
