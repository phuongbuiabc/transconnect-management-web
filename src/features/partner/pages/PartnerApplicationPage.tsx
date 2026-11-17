import { useState } from 'react';
import { ErrorNotice, Loading } from '../../../shared/ui';
import { EmptyRecords, PageHeader } from '../../../shared/ui/RecordLayout';
import { ReviewHistory } from '../../foundation/components/ReviewHistory';
import { Status } from '../../organizations/components/OrganizationStatus';
import { useApplication } from '../../organizations/hooks/useApplication';
import type { Organization } from '../../organizations/models/organization';
import { ServiceTypePicker } from '../../transport/components/ServiceTypePicker';
import { serviceTypeLabel } from '../../transport/models/transport';
import { usePartner } from '../hooks/usePartner';

/** Submit, follow and resubmit the account's own organization applications. */
export function PartnerApplicationPage() {
  const partner = usePartner();
  const application = useApplication(partner.reload);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [creating, setCreating] = useState(false);
  const active = partner.applications.some((item) => item.reviewStatus !== 'Rejected');
  const canApply = partner.stage !== 'member' && partner.stage !== 'driver-account';
  const showForm =
    canApply && (editing !== null || creating || (!active && !partner.applications.length));
  return (
    <section className="partner-flow">
      <PageHeader
        title="Hồ sơ đăng ký tổ chức"
        description="Nộp hồ sơ đơn vị vận tải, theo dõi kết quả duyệt và sửa hồ sơ bị từ chối."
      />
      {partner.error ? <ErrorNotice error={partner.error} retry={partner.reload} /> : null}
      {partner.stage === 'driver-account' ? (
        <p className="notice">
          Tài khoản tài xế không thể đăng ký tổ chức. Dùng một tài khoản đối tác riêng.
        </p>
      ) : null}
      {showForm ? (
        <ApplicationForm
          key={editing?.id ?? 'new'}
          initial={editing}
          busy={application.busy}
          error={application.error}
          onCancel={
            editing || creating
              ? () => {
                  setEditing(null);
                  setCreating(false);
                }
              : undefined
          }
          onSubmit={async (name, number, types) => {
            const saved = await application.submit(name, number, types, editing?.id);
            if (saved) {
              setEditing(null);
              setCreating(false);
            }
          }}
        />
      ) : null}
      {partner.loading ? (
        <Loading />
      ) : partner.applications.length ? (
        <div className="partner-list">
          {partner.applications.map((org) => (
            <article className="panel partner-record" key={org.id}>
              <div className="partner-stage-title">
                <h2>{org.name}</h2>
                <Status value={org.reviewStatus} />
              </div>
              <p className="partner-meta">Mã số thuế {org.registrationNumber}</p>
              {org.requestedServiceTypes?.length ? (
                <p className="partner-meta">
                  Dịch vụ đăng ký: {org.requestedServiceTypes.map(serviceTypeLabel).join(', ')}
                </p>
              ) : null}
              {org.reviewNote ? (
                <p>
                  <strong>Ghi chú xét duyệt:</strong> {org.reviewNote}
                </p>
              ) : null}
              {org.reviewStatus === 'Rejected' && canApply && editing?.id !== org.id ? (
                <button
                  type="button"
                  className="button primary"
                  onClick={() => {
                    setCreating(false);
                    setEditing(org);
                  }}
                >
                  Sửa và nộp lại
                </button>
              ) : null}
              <details>
                <summary>Lịch sử xét duyệt</summary>
                <ReviewHistory key={org.reviewStatus} type="organizations" id={org.id} />
              </details>
            </article>
          ))}
          {canApply && !showForm ? (
            <button type="button" className="button secondary" onClick={() => setCreating(true)}>
              Nộp hồ sơ tổ chức khác
            </button>
          ) : null}
        </div>
      ) : !showForm ? (
        <EmptyRecords title="Chưa có hồ sơ" description="Bạn chưa nộp hồ sơ tổ chức nào." />
      ) : null}
    </section>
  );
}

function ApplicationForm({
  initial,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  initial: Organization | null;
  busy: boolean;
  error: unknown;
  onSubmit: (name: string, registrationNumber: string, types: string[]) => Promise<void>;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [number, setNumber] = useState(initial?.registrationNumber ?? '');
  const [types, setTypes] = useState<string[]>(initial?.requestedServiceTypes ?? []);
  return (
    <form
      className="panel partner-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (types.length) void onSubmit(name.trim(), number.trim(), types);
      }}
    >
      <h2>{initial ? 'Sửa và nộp lại hồ sơ' : 'Đăng ký tổ chức mới'}</h2>
      <p>
        Bước này cần tên pháp lý, mã số thuế và loại dịch vụ dự định khai thác. Loại hình, địa chỉ
        và liên hệ được bổ sung trong mục Thông tin tổ chức sau khi bạn nhận quyền Owner.
      </p>
      <label>
        Tên tổ chức theo giấy đăng ký
        <input required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        Mã số thuế
        <input
          required
          inputMode="numeric"
          pattern="[0-9]{10}([0-9]{3})?"
          title="10 hoặc 13 chữ số"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
        />
      </label>
      <ServiceTypePicker value={types} onChange={setTypes} />
      {error ? <ErrorNotice error={error} /> : null}
      <div className="partner-actions">
        <button className="button primary" disabled={busy || !types.length}>
          {busy ? 'Đang gửi…' : initial ? 'Nộp lại hồ sơ' : 'Nộp hồ sơ'}
        </button>
        {onCancel ? (
          <button type="button" className="button secondary" onClick={onCancel}>
            Hủy
          </button>
        ) : null}
      </div>
    </form>
  );
}
