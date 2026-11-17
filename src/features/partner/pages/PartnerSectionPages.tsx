import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Loading } from '../../../shared/ui';
import { PageHeader } from '../../../shared/ui/RecordLayout';
import { AccountSettings } from '../../auth/pages/AccountSettings';
import {
  OrganizationDrivers,
  OrganizationMembers,
  OrganizationProfile,
  OrganizationVehicles,
} from '../../foundation/components/OrganizationSections';
import { LocationsPage } from '../../locations/pages/LocationsPage';
import { CoachGate } from '../../transport/components/CoachGate';
import { FaresWorkspace } from '../../transport/components/FaresWorkspace';
import { RoutesWorkspace } from '../../transport/components/RoutesWorkspace';
import { SchedulesWorkspace } from '../../transport/components/SchedulesWorkspace';
import { SeatLayoutsWorkspace } from '../../transport/components/SeatLayoutsWorkspace';
import { ServiceRegistrations } from '../../transport/components/ServiceRegistrations';
import { usePartner } from '../hooks/usePartner';
import { roleLabel } from '../models/partnerStage';

/** Membership pages only render for an active member; owner pages also require the Owner role. */
function MemberPage({
  title,
  description,
  ownerOnly = false,
  children,
}: {
  title: string;
  description: string;
  ownerOnly?: boolean;
  children: (organizationId: string, role: string) => ReactNode;
}) {
  const partner = usePartner();
  if (partner.loading) return <Loading />;
  const membership = partner.membership;
  if (!membership || (ownerOnly && !partner.isOwner)) return <Navigate to="/partner" replace />;
  return (
    <section className="partner-flow foundation-workspace">
      <PageHeader
        title={title}
        description={
          description + ' · ' + membership.organizationName + ' · ' + roleLabel(membership.role)
        }
      />
      {children(membership.organizationId, membership.role)}
    </section>
  );
}

export function PartnerDriversPage() {
  return (
    <MemberPage title="Tài xế cộng tác" description="Mời tài xế theo email và theo dõi cộng tác">
      {(id, role) => <OrganizationDrivers key={id} id={id} role={role} />}
    </MemberPage>
  );
}

export function PartnerVehiclesPage() {
  return (
    <MemberPage title="Phương tiện" description="Xe tổ chức đang khai thác">
      {(id, role) => <OrganizationVehicles key={id} id={id} role={role} />}
    </MemberPage>
  );
}

export function PartnerMembersPage() {
  return (
    <MemberPage
      title="Nhân viên"
      description="Mời quản lý, điều phối và quản lý tư cách thành viên"
      ownerOnly
    >
      {(id) => <OrganizationMembers key={id} id={id} />}
    </MemberPage>
  );
}

export function PartnerProfilePage() {
  const partner = usePartner();
  return (
    <MemberPage
      title="Thông tin tổ chức"
      description="Loại hình, địa chỉ đăng ký và kênh liên hệ của tổ chức"
      ownerOnly
    >
      {(id) => <OrganizationProfile key={id} id={id} onSaved={partner.reload} />}
    </MemberPage>
  );
}

export function PartnerLocationsPage() {
  return (
    <MemberPage
      title="Địa điểm"
      description="Đề xuất điểm đón trả của tổ chức để nền tảng xét duyệt"
      ownerOnly
    >
      {(id) => <LocationsPage key={id} organizationId={id} />}
    </MemberPage>
  );
}

export function PartnerServicesPage() {
  const partner = usePartner();
  return (
    <MemberPage
      title="Dịch vụ"
      description="Đăng ký loại dịch vụ khai thác và theo dõi kết quả xét duyệt"
    >
      {(id) => (
        <ServiceRegistrations
          key={id}
          organizationId={id}
          isOwner={partner.isOwner}
          onChanged={partner.reload}
        />
      )}
    </MemberPage>
  );
}

export function PartnerRoutesPage() {
  return (
    <MemberPage title="Tuyến xe khách" description="Tạo tuyến, điểm dừng và công bố phiên bản">
      {(id) => (
        <CoachGate key={id} organizationId={id}>
          {(canOperate) => <RoutesWorkspace organizationId={id} canOperate={canOperate} />}
        </CoachGate>
      )}
    </MemberPage>
  );
}

export function PartnerSeatLayoutsPage() {
  return (
    <MemberPage title="Sơ đồ ghế" description="Sơ đồ ghế theo xe và mẫu hệ thống">
      {(id) => (
        <CoachGate key={id} organizationId={id}>
          {(canOperate) => <SeatLayoutsWorkspace organizationId={id} canOperate={canOperate} />}
        </CoachGate>
      )}
    </MemberPage>
  );
}

export function PartnerSchedulesPage() {
  return (
    <MemberPage title="Lịch chạy" description="Lịch định kỳ, xe dự kiến và ghế dành cho VieGo">
      {(id) => (
        <CoachGate key={id} organizationId={id}>
          {(canOperate) => <SchedulesWorkspace organizationId={id} canOperate={canOperate} />}
        </CoachGate>
      )}
    </MemberPage>
  );
}

export function PartnerFaresPage() {
  const partner = usePartner();
  return (
    <MemberPage title="Bảng giá" description="Giá từng chặng đón – trả theo bản tuyến">
      {(id) => (
        <CoachGate key={id} organizationId={id}>
          {(canOperate) => (
            <FaresWorkspace organizationId={id} canOperate={canOperate} isOwner={partner.isOwner} />
          )}
        </CoachGate>
      )}
    </MemberPage>
  );
}

export function PartnerAccountPage() {
  return (
    <section className="partner-flow foundation-workspace">
      <PageHeader
        title="Tài khoản"
        description="Tên hiển thị, số điện thoại, ảnh đại diện và mật khẩu đăng nhập."
      />
      <AccountSettings defaultOpen />
    </section>
  );
}
