import { useState } from 'react';
import { ErrorNotice, Loading } from '../../../shared/ui';
import { transportApi } from '../api/transportApi';
import { useServiceRegistrations } from '../hooks/useTransport';
import { currentRegistration } from '../models/scheduleRules';
import type { Registration, ServiceType } from '../models/transport';
import { TransportStatus } from './TransportStatus';
import '../transport.css';

/** Partner: mỗi loại dịch vụ một thẻ; Owner đăng ký, nộp lại hoặc rút; thành viên khác chỉ xem. */
export function ServiceRegistrations({
  organizationId,
  isOwner,
  onChanged,
}: {
  organizationId: string;
  isOwner: boolean;
  onChanged?: () => void;
}) {
  const state = useServiceRegistrations(organizationId);
  if (state.loading) return <Loading />;
  if (!state.data) return <ErrorNotice error={state.error} retry={state.reload} />;
  const run = async (action: () => Promise<unknown>) => {
    const ok = await state.mutate(action);
    if (ok) onChanged?.();
    return ok;
  };
  return (
    <div className="partner-list">
      {state.error ? <ErrorNotice error={state.error} /> : null}
      {!isOwner ? (
        <p className="notice">Chỉ Owner của tổ chức được đăng ký hoặc rút đăng ký dịch vụ.</p>
      ) : null}
      {state.data.types.map((type) => (
        <ServiceCard
          key={type.code}
          type={type}
          registration={currentRegistration(state.data?.registrations, type.code)}
          isOwner={isOwner}
          busy={state.busy}
          onSubmit={(scope) =>
            run(() => transportApi.submitRegistration(organizationId, type.code, scope))
          }
          onResubmit={(item, scope) =>
            run(() => transportApi.resubmitRegistration(organizationId, item, scope))
          }
          onWithdraw={(item, note) =>
            run(() => transportApi.withdrawRegistration(organizationId, item, note))
          }
        />
      ))}
    </div>
  );
}

function ServiceCard({
  type,
  registration,
  isOwner,
  busy,
  onSubmit,
  onResubmit,
  onWithdraw,
}: {
  type: ServiceType;
  registration: Registration | null;
  isOwner: boolean;
  busy: boolean;
  onSubmit: (scope: string) => Promise<boolean>;
  onResubmit: (item: Registration, scope: string) => Promise<boolean>;
  onWithdraw: (item: Registration, note: string) => Promise<boolean>;
}) {
  const [mode, setMode] = useState<'none' | 'submit' | 'withdraw'>('none');
  const [text, setText] = useState('');
  const status = registration?.status;
  const canSubmit = !registration || status === 'Withdrawn' || status === 'Rejected';
  const canWithdraw = registration && status !== 'Withdrawn';
  async function confirm() {
    const ok =
      mode === 'withdraw' && registration
        ? await onWithdraw(registration, text.trim())
        : registration?.status === 'Rejected'
          ? await onResubmit(registration, text.trim())
          : await onSubmit(text.trim());
    if (ok) {
      setMode('none');
      setText('');
    }
  }
  return (
    <article className="panel partner-record">
      <div className="partner-stage-title">
        <h2>{type.name}</h2>
        {registration ? <TransportStatus value={registration.status} /> : null}
      </div>
      <p>{type.description}</p>
      {!type.isOperational ? (
        <p className="partner-meta">
          Loại dịch vụ này đang ghi nhận đăng ký; tính năng khai thác sẽ mở ở giai đoạn sau.
        </p>
      ) : null}
      {registration?.scopeNote ? (
        <p>
          <strong>Phạm vi khai báo:</strong> {registration.scopeNote}
        </p>
      ) : null}
      {registration?.reviewNote ? (
        <p>
          <strong>Ghi chú của quản trị viên:</strong> {registration.reviewNote}
        </p>
      ) : null}
      {status === 'Approved' && type.isOperational ? (
        <p className="notice success">
          Đã được duyệt. Bạn có thể tạo tuyến, sơ đồ ghế và lịch chạy.
        </p>
      ) : null}
      {status === 'Suspended' ? (
        <p className="notice">
          Dịch vụ đang tạm ngưng: lịch chạy đã tạm dừng, chưa thể kích hoạt lịch mới.
        </p>
      ) : null}
      {isOwner && mode === 'none' ? (
        <div className="partner-actions">
          {canSubmit ? (
            <button
              type="button"
              className="button primary"
              disabled={busy}
              onClick={() => {
                setText(registration?.status === 'Rejected' ? (registration.scopeNote ?? '') : '');
                setMode('submit');
              }}
            >
              {status === 'Rejected' ? 'Sửa và nộp lại' : 'Đăng ký dịch vụ'}
            </button>
          ) : null}
          {canWithdraw ? (
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={() => {
                setText('');
                setMode('withdraw');
              }}
            >
              Rút đăng ký
            </button>
          ) : null}
        </div>
      ) : null}
      {mode !== 'none' ? (
        <form
          className="partner-form"
          onSubmit={(e) => {
            e.preventDefault();
            void confirm();
          }}
        >
          <label>
            {mode === 'withdraw'
              ? 'Lý do rút (không bắt buộc)'
              : 'Phạm vi khai thác: tuyến, khu vực, số xe dự kiến (không bắt buộc)'}
            <textarea
              rows={3}
              maxLength={2000}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          {mode === 'withdraw' && status === 'Approved' ? (
            <p className="notice">
              Rút đăng ký sẽ tạm dừng toàn bộ lịch chạy đang hoạt động của dịch vụ này.
            </p>
          ) : null}
          <div className="partner-actions">
            <button
              className={'button ' + (mode === 'withdraw' ? 'danger' : 'primary')}
              disabled={busy}
            >
              {busy ? 'Đang gửi…' : mode === 'withdraw' ? 'Xác nhận rút' : 'Gửi đăng ký'}
            </button>
            <button type="button" className="button secondary" onClick={() => setMode('none')}>
              Hủy
            </button>
          </div>
        </form>
      ) : null}
      {registration?.events?.length ? (
        <details>
          <summary>Lịch sử đăng ký</summary>
          <ol className="transport-history">
            {registration.events.map((event) => (
              <li key={event.id}>
                {new Date(event.createdAt).toLocaleString('vi-VN')} ·{' '}
                <TransportStatus value={event.status} />
                {event.note ? ' · ' + event.note : ''}
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </article>
  );
}
