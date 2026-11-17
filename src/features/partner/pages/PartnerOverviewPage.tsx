import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { ErrorNotice, Loading } from '../../../shared/ui';
import { Icon } from '../../../shared/ui/Icon';
import { PageHeader } from '../../../shared/ui/RecordLayout';
import { Status } from '../../organizations/components/OrganizationStatus';
import { usePartner } from '../hooks/usePartner';
import { latestApplication, roleLabel, type PartnerStage } from '../models/partnerStage';
import { FlowSteps } from '../components/FlowSteps';

const stepIndex: Record<PartnerStage, number> = {
  'verify-email': 0,
  'driver-account': 1,
  'no-application': 1,
  rejected: 1,
  pending: 2,
  'approved-awaiting-owner': 3,
  member: 4,
};

export function PartnerOverviewPage() {
  const auth = useAuth();
  const partner = usePartner();
  return (
    <section className="partner-flow">
      <PageHeader
        title={'Chào ' + (auth.user?.fullName || 'đối tác')}
        description="Theo dõi các bước để đơn vị vận tải của bạn bắt đầu hoạt động trên VieGo."
        action={
          partner.stage !== 'verify-email' ? (
            <button
              type="button"
              className="button secondary"
              disabled={partner.loading || partner.busy}
              onClick={partner.reload}
            >
              <Icon name="refresh" />
              Làm mới
            </button>
          ) : null
        }
      />
      <FlowSteps
        current={stepIndex[partner.stage]}
        steps={['Xác thực email', 'Nộp hồ sơ', 'Chờ duyệt', 'Nhận quyền Owner', 'Vận hành']}
      />
      {partner.error ? <ErrorNotice error={partner.error} retry={partner.reload} /> : null}
      {partner.loading ? <Loading /> : <StageCard />}
      {!partner.loading && partner.stage !== 'member' && partner.openInvitations.length ? (
        <section className="panel partner-callout">
          <Icon name="mail" />
          <div>
            <h2>Bạn có {partner.openInvitations.length} lời mời đang chờ</h2>
            <p>Nhận lời mời nếu bạn tham gia tổ chức đã có trên VieGo thay vì đăng ký mới.</p>
          </div>
          <Link className="button secondary" to="/partner/invitations">
            Xem lời mời
          </Link>
        </section>
      ) : null}
    </section>
  );
}

function StageCard() {
  const partner = usePartner();
  const application = latestApplication(partner.applications);
  switch (partner.stage) {
    case 'verify-email':
      return <VerifyEmail />;
    case 'driver-account':
      return (
        <StagePanel
          title="Tài khoản này đang là tài khoản tài xế"
          text="Owner và tài xế cần hai tài khoản riêng. Dùng app VieGo Driver cho hồ sơ tài xế; đăng ký tổ chức bằng một tài khoản đối tác khác."
        />
      );
    case 'no-application':
      return (
        <StagePanel
          title="Đăng ký đơn vị vận tải"
          text="Khai thông tin doanh nghiệp và dịch vụ dự định khai thác để nền tảng xét duyệt. Sau khi được duyệt, tài khoản của bạn trở thành Owner của tổ chức."
          action={
            <Link className="button primary" to="/partner/register">
              Bắt đầu đăng ký
            </Link>
          }
        />
      );
    case 'pending':
      return (
        <StagePanel
          title="Hồ sơ đang chờ duyệt"
          status={application ? <Status value={application.reviewStatus} /> : null}
          text={`${application?.name ?? 'Hồ sơ'} đang được nền tảng xem xét. Bạn sẽ có quyền quản lý ngay khi hồ sơ được duyệt.`}
          action={
            <Link className="button secondary" to="/partner/application">
              Xem hồ sơ đã nộp
            </Link>
          }
        />
      );
    case 'rejected':
      return (
        <StagePanel
          title="Hồ sơ cần sửa và nộp lại"
          status={application ? <Status value={application.reviewStatus} /> : null}
          text={application?.reviewNote || 'Nền tảng chưa ghi lý do từ chối.'}
          action={
            <Link className="button primary" to="/partner/register">
              Sửa và nộp lại
            </Link>
          }
        />
      );
    case 'approved-awaiting-owner':
      return (
        <StagePanel
          title="Hồ sơ đã được duyệt"
          status={application ? <Status value={application.reviewStatus} /> : null}
          text="Quyền Owner được cấp qua lời mời gửi tới email người nhận Owner. Mở danh sách lời mời để nhận quyền."
          action={
            <Link className="button primary" to="/partner/invitations">
              Mở lời mời
            </Link>
          }
        />
      );
    case 'member':
      return <MemberSummary />;
  }
}

function MemberSummary() {
  const { membership, isOwner, applications } = usePartner();
  if (!membership) return null;
  const organization = applications.find((item) => item.id === membership.organizationId);
  const canManage = membership.capabilities.includes('manage');
  return (
    <>
      <StagePanel
        title={membership.organizationName}
        text={'Vai trò của bạn: ' + roleLabel(membership.role)}
        action={
          <Link className="button primary" to="/partner/drivers">
            Mở danh sách tài xế
          </Link>
        }
      />
      {isOwner && organization && organization.isProfileComplete === false ? (
        <section className="panel partner-callout is-pending">
          <Icon name="info" />
          <div>
            <h2>Bổ sung thông tin tổ chức</h2>
            <p>Hồ sơ còn thiếu loại hình, địa chỉ hoặc liên hệ. Bổ sung để hồ sơ đầy đủ.</p>
          </div>
          <Link className="button secondary" to="/partner/profile">
            Bổ sung
          </Link>
        </section>
      ) : null}
      <div className="partner-metrics">
        <Metric
          label="Nhân viên và lời mời"
          value={`${membership.employeeOccupancy}/${membership.employeeLimit}`}
        />
        <Metric
          label="Tài xế và lời mời"
          value={`${membership.driverOccupancy}/${membership.driverLimit ?? '∞'}`}
        />
        <Metric label="Quyền thao tác" value={canManage ? 'Quản lý' : 'Chỉ xem'} />
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel partner-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StagePanel({
  title,
  text,
  status,
  action,
}: {
  title: string;
  text: string;
  status?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="panel partner-stage">
      <div>
        <div className="partner-stage-title">
          <h2>{title}</h2>
          {status}
        </div>
        <p>{text}</p>
      </div>
      {action}
    </section>
  );
}

function VerifyEmail() {
  const auth = useAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState('');
  async function run(resend: boolean) {
    setBusy(true);
    setError(null);
    setNotice('');
    try {
      if (resend) {
        await auth.resend();
        setNotice('Đã yêu cầu gửi mã. Kiểm tra hộp thư.');
      } else await auth.verify(code.trim());
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className="panel partner-stage partner-form"
      onSubmit={(e) => {
        e.preventDefault();
        void run(false);
      }}
    >
      <div>
        <h2>Xác thực email để tiếp tục</h2>
        <p>Nhập mã đã gửi tới {auth.user?.email}. Sau bước này bạn có thể nộp hồ sơ tổ chức.</p>
        <label>
          Mã xác thực
          <input
            required
            value={code}
            inputMode="numeric"
            autoComplete="one-time-code"
            onChange={(e) => setCode(e.target.value)}
          />
        </label>
        {error ? <ErrorNotice error={error} /> : null}
        {notice ? <p role="status">{notice}</p> : null}
      </div>
      <div className="partner-actions">
        <button className="button primary" disabled={busy || !code.trim()}>
          Xác thực
        </button>
        <button
          type="button"
          className="button secondary"
          disabled={busy}
          onClick={() => void run(true)}
        >
          Gửi lại mã
        </button>
      </div>
    </form>
  );
}
