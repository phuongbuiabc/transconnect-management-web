import { useState } from 'react';
import { ErrorNotice, Loading } from '../../../shared/ui';
import { EmptyRecords, PageHeader } from '../../../shared/ui/RecordLayout';
import { vietnamDateTime } from '../../transport/models/trips';
import { useAdminBookings } from '../hooks/useBooking';
import { bookingStatusLabels, bookingStatusTone, channelLabels, money } from '../models/booking';
import '../booking.css';

/** Admin: tra cứu đặt chỗ (chỉ đọc) theo mã, 200 dòng mới nhất. */
export function AdminBookingsPage() {
  const [input, setInput] = useState('');
  const [code, setCode] = useState('');
  const state = useAdminBookings(code);
  return (
    <section className="foundation-workspace">
      <PageHeader title="Đặt chỗ" description="Tra cứu đặt chỗ của mọi nhà xe (chỉ đọc)." />
      <form
        className="inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          setCode(input.trim().toUpperCase());
        }}
      >
        <label>
          Mã đặt chỗ
          <input value={input} maxLength={20} onChange={(e) => setInput(e.target.value)} />
        </label>
        <button className="button primary">Tìm</button>
      </form>
      {state.loading ? (
        <Loading />
      ) : !state.data ? (
        <ErrorNotice error={state.error} retry={state.reload} />
      ) : state.data.length === 0 ? (
        <EmptyRecords title="Không có đặt chỗ" description="Thử mã khác." />
      ) : (
        <div className="table-scroll">
          <table className="booking-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Nhà xe</th>
                <th>Chuyến</th>
                <th>Đoạn</th>
                <th>Ghế</th>
                <th>Tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {state.data.map((b) => (
                <tr key={b.id}>
                  <td>
                    {b.code}
                    <br />
                    <small>{channelLabels[b.channel]}</small>
                  </td>
                  <td>{b.organizationName}</td>
                  <td>
                    {vietnamDateTime(b.tripDepartureAt)}
                    <br />
                    <small>{b.routeName}</small>
                  </td>
                  <td>
                    {b.fromName} → {b.toName}
                  </td>
                  <td>{b.seats.join(', ') || b.passengerCount + ' khách'}</td>
                  <td>{money(b.totalAmount)}</td>
                  <td>
                    <span className={'status status-' + bookingStatusTone[b.status]}>
                      <span aria-hidden="true" />
                      {bookingStatusLabels[b.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
