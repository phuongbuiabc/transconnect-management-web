import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { PartnerProvider, usePartner } from '../../features/partner/hooks/usePartner';
import { roleLabel } from '../../features/partner/models/partnerStage';
import { useCoachAccess } from '../../features/transport/hooks/useTransport';
import { Loading } from '../../shared/ui';
import { WorkspaceShell, type ShellDestination } from './ManagementLayout';
import '../../features/partner/partner.css';

/** Operator-only partner portal; destinations follow the onboarding stage and membership role. */
export function PartnerLayout() {
  const auth = useAuth();
  if (auth.loading)
    return (
      <main className="center-page">
        <Loading text="Đang xác minh phiên đăng nhập…" />
      </main>
    );
  if (!auth.user) return <Navigate to="/login/partner" replace />;
  if (auth.user.accountGroup !== 'Operator') return <Navigate to="/admin" replace />;
  return (
    <PartnerProvider key={auth.user.accountId}>
      <PartnerShell />
    </PartnerProvider>
  );
}

function PartnerShell() {
  const partner = usePartner();
  const coach = useCoachAccess(partner.membership?.organizationId);
  const destinations: ShellDestination[] = [
    { path: '/partner', label: 'Tổng quan', icon: 'home', end: true },
  ];
  if (partner.stage !== 'verify-email') {
    if (partner.membership) {
      destinations.push(
        { path: '/partner/drivers', label: 'Tài xế', icon: 'drivers' },
        { path: '/partner/vehicles', label: 'Phương tiện', icon: 'vehicle' },
        { path: '/partner/services', label: 'Dịch vụ', icon: 'shield' },
      );
      if (coach.canView)
        destinations.push(
          { path: '/partner/routes', label: 'Tuyến', icon: 'locations' },
          { path: '/partner/seat-layouts', label: 'Sơ đồ ghế', icon: 'vehicle' },
          { path: '/partner/schedules', label: 'Lịch chạy', icon: 'document' },
          { path: '/partner/trips', label: 'Chuyến', icon: 'vehicle' },
          { path: '/partner/bookings', label: 'Đặt chỗ', icon: 'check' },
          { path: '/partner/fares', label: 'Bảng giá', icon: 'document' },
        );
      if (partner.isOwner)
        destinations.push(
          { path: '/partner/members', label: 'Nhân viên', icon: 'team' },
          { path: '/partner/profile', label: 'Thông tin tổ chức', icon: 'organizations' },
          { path: '/partner/locations', label: 'Địa điểm', icon: 'locations' },
        );
    } else
      destinations.push(
        { path: '/partner/application', label: 'Hồ sơ đăng ký', icon: 'document' },
        { path: '/partner/invitations', label: 'Lời mời', icon: 'mail' },
      );
  }
  destinations.push({ path: '/partner/account', label: 'Tài khoản', icon: 'accounts' });
  return (
    <WorkspaceShell
      basePath="/partner"
      rootLabel="Đối tác"
      caption="Cổng đối tác vận tải"
      roleLabel={partner.membership ? roleLabel(partner.membership.role) : 'Đối tác'}
      workspaceTitle={partner.membership?.organizationName || 'Không gian đối tác'}
      workspaceSubtitle={partner.membership ? 'Tổ chức của bạn' : 'Chưa thuộc tổ chức'}
      contextLabel="Không gian đối tác"
      navigationLabel="Điều hướng đối tác"
      destinations={destinations}
    />
  );
}
