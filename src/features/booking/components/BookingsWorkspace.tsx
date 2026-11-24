import { useState } from 'react';
import { ErrorNotice, Loading } from '../../../shared/ui';
import { EmptyRecords } from '../../../shared/ui/RecordLayout';
import { vietnamDateTime } from '../../transport/models/trips';
import { bookingApi } from '../api/bookingApi';
import { useBookingPolicy, usePendingBookings } from '../hooks/useBooking';
import { money, type BookingPolicy } from '../models/booking';
import '../booking.css';

/** Trang Đặt chỗ của nhà xe: yêu cầu chờ duyệt toàn tổ chức + chính sách đặt chỗ. */
export function BookingsWorkspace({
  organizationId,
  isOwner,
  onOpenTrip,
}: {
  organizationId: string;
  isOwner: boolean;
  onOpenTrip: (tripId: string) => void;
}) {
  return (
    <div className="partner-list">
      <PendingRequests organizationId={organizationId} onOpenTrip={onOpenTrip} />
      <PolicyPanel organizationId={organizationId} isOwner={isOwner} />
    </div>
  );
}

function PendingRequests({
  organizationId,
  onOpenTrip,
}: {
  organizationId: string;
  onOpenTrip: (tripId: string) => void;
}) {
  const state = usePendingBookings(organizationId);
  return (
    <section className="panel">
      <h3>Yêu cầu chờ duyệt</h3>
      <p className="partner-meta">
        Chuyến "nhà xe duyệt": mở chuyến để xếp ghế rồi duyệt, hoặc từ chối kèm lý do. Yêu cầu quá
        hạn tự hết hạn.
      </p>
      {state.loading ? (
        <Loading />
      ) : !state.data ? (
        <ErrorNotice error={state.error} retry={state.reload} />
      ) : state.data.length === 0 ? (
        <EmptyRecords
          title="Không có yêu cầu nào"
          description="Yêu cầu mới của khách sẽ hiện ở đây."
        />
      ) : (
        <div className="table-scroll">
          <table className="booking-table">
            <thead>
              <tr>
                <th>Hạn duyệt</th>
                <th>Mã</th>
                <th>Chuyến</th>
                <th>Người đặt</th>
                <th>Đoạn</th>
                <th>Số khách</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.data.map((b) => (
                <tr key={b.id}>
                  <td>{b.decisionDueAt ? vietnamDateTime(b.decisionDueAt) : '—'}</td>
                  <td>{b.code}</td>
                  <td>
                    {vietnamDateTime(b.tripDepartureAt)}
                    <br />
                    <small>{b.routeName}</small>
                  </td>
                  <td>
                    {b.contactName}
                    <br />
                    <a href={'tel:' + b.contactPhone}>{b.contactPhone}</a>
                  </td>
                  <td>
                    {b.fromName} → {b.toName}
                  </td>
                  <td>
                    {b.passengerCount} · ~{money(b.totalAmount)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="button primary"
                      onClick={() => onOpenTrip(b.tripId)}
                    >
                      Mở chuyến
                    </button>
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

const policyFields: {
  key: keyof Pick<
    BookingPolicy,
    | 'holdMinutes'
    | 'decisionHours'
    | 'decisionCutoffMinutes'
    | 'salesCloseMinutes'
    | 'cancelCutoffHours'
  >;
  label: string;
  hint: string;
  min: number;
  max: number;
}[] = [
  {
    key: 'holdMinutes',
    label: 'Giữ chỗ (phút)',
    hint: 'Khách phải xác nhận trong thời gian này',
    min: 5,
    max: 60,
  },
  {
    key: 'decisionHours',
    label: 'Hạn duyệt (giờ)',
    hint: 'Nhà xe trả lời yêu cầu trong',
    min: 1,
    max: 24,
  },
  {
    key: 'decisionCutoffMinutes',
    label: 'Chốt duyệt trước giờ chạy (phút)',
    hint: 'Hạn duyệt không muộn hơn mốc này',
    min: 0,
    max: 1440,
  },
  {
    key: 'salesCloseMinutes',
    label: 'Ngừng bán online trước giờ chạy (phút)',
    hint: 'Vé ngoài vẫn nhập được tới giờ xuất bến',
    min: 0,
    max: 1440,
  },
  {
    key: 'cancelCutoffHours',
    label: 'Khách tự hủy trước giờ chạy (giờ)',
    hint: 'Sau mốc này khách liên hệ nhà xe',
    min: 0,
    max: 168,
  },
];

function PolicyPanel({ organizationId, isOwner }: { organizationId: string; isOwner: boolean }) {
  const state = useBookingPolicy(organizationId);
  const [draft, setDraft] = useState<BookingPolicy | null>(null);
  const [saved, setSaved] = useState(false);
  if (state.loading) return <Loading />;
  if (!state.data) return <ErrorNotice error={state.error} retry={state.reload} />;
  const policy = draft ?? state.data;
  const invalid = policyFields.some(
    (f) => !Number.isInteger(policy[f.key]) || policy[f.key] < f.min || policy[f.key] > f.max,
  );
  return (
    <section className="panel">
      <h3>Chính sách đặt chỗ</h3>
      <p className="partner-meta">
        {state.data.isDefault ? 'Đang dùng mặc định VieGo. ' : ''}
        Áp dụng cho mọi tuyến của tổ chức.{isOwner ? '' : ' Chỉ chủ nhà xe được sửa.'}
      </p>
      {state.error ? <ErrorNotice error={state.error} /> : null}
      {saved ? <p className="notice success">Đã lưu chính sách.</p> : null}
      <form
        className="booking-section"
        onSubmit={async (e) => {
          e.preventDefault();
          if (invalid) return;
          if (await state.mutate(() => bookingApi.savePolicy(organizationId, policy))) {
            setDraft(null);
            setSaved(true);
          }
        }}
      >
        <div className="policy-form">
          {policyFields.map((f) => (
            <label key={f.key}>
              {f.label}
              <input
                type="number"
                min={f.min}
                max={f.max}
                value={Number.isNaN(policy[f.key]) ? '' : policy[f.key]}
                disabled={!isOwner}
                onChange={(e) => {
                  setSaved(false);
                  setDraft({ ...policy, [f.key]: e.target.valueAsNumber });
                }}
              />
              <small>
                {f.hint} ({f.min}–{f.max})
              </small>
            </label>
          ))}
        </div>
        {isOwner ? (
          <div className="partner-actions">
            <button className="button primary" disabled={state.busy || !draft || invalid}>
              Lưu chính sách
            </button>
            {draft ? (
              <button type="button" className="button secondary" onClick={() => setDraft(null)}>
                Hoàn tác
              </button>
            ) : null}
          </div>
        ) : null}
      </form>
    </section>
  );
}
