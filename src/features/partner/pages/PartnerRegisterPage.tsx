import { useState, type ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Brand, ErrorNotice, Loading } from '../../../shared/ui';
import { useAuth } from '../../auth/hooks/useAuth';
import { Status } from '../../organizations/components/OrganizationStatus';
import { FlowSteps } from '../components/FlowSteps';
import { AccountStep, VerifyStep } from '../components/RegistrationAccountSteps';
import {
  OrganizationStep,
  ReviewStep,
  ServicesStep,
} from '../components/RegistrationBusinessSteps';
import { PartnerProvider, usePartner } from '../hooks/usePartner';
import { useRegistration } from '../hooks/useRegistration';
import { latestApplication } from '../models/partnerStage';
import {
  registrationStep,
  registrationSteps,
  rejectedApplication,
  stepNumber,
} from '../models/registration';
import '../partner.css';
import './registration.css';

/** Wizard công khai /partner/register (PARTNER-REG-01). Bước luôn suy từ phiên và dữ liệu server. */
export function PartnerRegisterPage() {
  const auth = useAuth();
  if (auth.loading)
    return (
      <RegisterShell current={0}>
        <Loading text="Đang kiểm tra phiên đăng nhập…" />
      </RegisterShell>
    );
  const user = auth.user;
  if (user && user.accountGroup !== 'Operator') return <Navigate to="/admin" replace />;
  if (!user)
    return (
      <RegisterShell current={stepNumber.account}>
        <AccountStep />
      </RegisterShell>
    );
  if (!user.emailVerified)
    return (
      <RegisterShell current={stepNumber.verify}>
        <VerifyStep />
      </RegisterShell>
    );
  return (
    <PartnerProvider key={user.accountId}>
      <BusinessFlow />
    </PartnerProvider>
  );
}

function BusinessFlow() {
  const partner = usePartner();
  if (partner.loading)
    return (
      <RegisterShell current={stepNumber.organization}>
        <Loading text="Đang tải hồ sơ của bạn…" />
      </RegisterShell>
    );
  if (partner.error)
    return (
      <RegisterShell current={stepNumber.organization}>
        <ErrorNotice error={partner.error} retry={partner.reload} />
      </RegisterShell>
    );
  return <BusinessSteps />;
}

function BusinessSteps() {
  const auth = useAuth();
  const partner = usePartner();
  const rejected = rejectedApplication(partner.applications);
  const registration = useRegistration(auth.user?.accountId, rejected, partner.reload);
  const [local, setLocal] = useState<'organization' | 'services' | 'review'>('organization');
  const step = registrationStep({
    signedIn: true,
    emailVerified: true,
    stage: partner.stage,
    local,
    justSubmitted: registration.submitted !== null,
  });
  if (step === 'leave') {
    if (partner.stage === 'driver-account')
      return (
        <RegisterShell current={stepNumber.organization}>
          <section className="reg-card">
            <h2>Tài khoản này đang là tài khoản tài xế</h2>
            <p className="reg-lead">
              Owner và tài xế cần hai tài khoản riêng. Đăng xuất rồi tạo một tài khoản đối tác khác
              để đăng ký đơn vị vận tải.
            </p>
            <div className="reg-actions">
              <button type="button" className="button primary" onClick={() => void auth.signOut()}>
                Đăng xuất
              </button>
            </div>
          </section>
        </RegisterShell>
      );
    return <Navigate to="/partner" replace />;
  }
  const go = (next: typeof local) => {
    setLocal(next);
    window.scrollTo({ top: 0 });
  };
  return (
    <RegisterShell current={stepNumber[step]}>
      {step === 'organization' ? (
        <OrganizationStep
          draft={registration.draft}
          update={registration.update}
          rejectedNote={rejected ? (rejected.reviewNote ?? '') : null}
          onNext={() => go('services')}
        />
      ) : step === 'services' ? (
        <ServicesStep
          draft={registration.draft}
          update={registration.update}
          onBack={() => go('organization')}
          onNext={() => go('review')}
        />
      ) : step === 'review' ? (
        <ReviewStep
          draft={registration.draft}
          email={auth.user?.email ?? ''}
          busy={registration.busy}
          error={registration.error}
          onEdit={go}
          onSubmit={() => void registration.submit()}
        />
      ) : (
        <Submitted />
      )}
    </RegisterShell>
  );
}

function Submitted() {
  const auth = useAuth();
  const partner = usePartner();
  const application = latestApplication(partner.applications);
  return (
    <section className="reg-card reg-done" aria-labelledby="reg-done-title">
      <h2 id="reg-done-title">Đã nộp hồ sơ</h2>
      {application ? (
        <div className="reg-done-record">
          <strong>{application.name}</strong>
          <Status value={application.reviewStatus} />
        </div>
      ) : null}
      <ol className="reg-next">
        <li>Nền tảng xét duyệt hồ sơ tổ chức của bạn.</li>
        <li>
          Khi được duyệt, lời mời nhận quyền Owner được gửi tới <strong>{auth.user?.email}</strong>.
        </li>
        <li>Nhận lời mời trong cổng đối tác để bắt đầu quản lý xe, tài xế và dịch vụ.</li>
      </ol>
      <div className="reg-actions">
        <Link className="button primary" to="/partner">
          Vào cổng đối tác
        </Link>
      </div>
    </section>
  );
}

function RegisterShell({ current, children }: { current: number; children: ReactNode }) {
  const auth = useAuth();
  return (
    <main className="reg-page">
      <header className="reg-header">
        <Brand />
        {auth.user ? (
          <button type="button" className="text-link" onClick={() => void auth.signOut()}>
            Đăng xuất
          </button>
        ) : (
          <Link className="text-link" to="/login/partner">
            Đăng nhập
          </Link>
        )}
      </header>
      <div className="reg-body">
        <div className="reg-intro">
          <p className="reg-eyebrow">Đăng ký đối tác vận tải</p>
          <h1>Đưa đơn vị vận tải của bạn lên VieGo</h1>
        </div>
        <FlowSteps steps={[...registrationSteps]} current={current} />
        {children}
      </div>
    </main>
  );
}
