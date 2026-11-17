import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { Protected } from './router/Protected';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { OrganizationList } from '../features/organizations/pages/OrganizationListPage';
import { OrganizationDetail } from '../features/organizations/pages/OrganizationDetailPage';
import { AccountsPage } from '../features/accounts/pages/AccountsPage';
import { DriversPage } from '../features/foundation/pages/DriversPage';
import { PartnerLayout } from './layouts/PartnerLayout';
import { PartnerOverviewPage } from '../features/partner/pages/PartnerOverviewPage';
import { PartnerApplicationPage } from '../features/partner/pages/PartnerApplicationPage';
import { PartnerInvitationsPage } from '../features/partner/pages/PartnerInvitationsPage';
import { PartnerRegisterPage } from '../features/partner/pages/PartnerRegisterPage';
import {
  PartnerAccountPage,
  PartnerDriversPage,
  PartnerFaresPage,
  PartnerLocationsPage,
  PartnerMembersPage,
  PartnerProfilePage,
  PartnerRoutesPage,
  PartnerSchedulesPage,
  PartnerSeatLayoutsPage,
  PartnerServicesPage,
  PartnerVehiclesPage,
} from '../features/partner/pages/PartnerSectionPages';
import { useAuth } from '../features/auth/hooks/useAuth';
import { LocationsPage } from '../features/locations/pages/LocationsPage';
import {
  AdminServiceDetailPage,
  AdminServicesPage,
} from '../features/transport/pages/AdminServicesPage';
function AdminLanding() {
  const auth = useAuth();
  return (
    <Navigate
      to={
        auth.user?.permissions.includes('organizations.manage')
          ? 'organizations'
          : auth.user?.permissions.includes('services.review')
            ? 'services'
            : auth.user?.permissions.includes('users.manage')
              ? 'accounts'
              : 'locations'
      }
      replace
    />
  );
}
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/login/admin" replace />} />
      <Route path="/login/admin" element={<LoginPage key="admin" portal="InternalAdmin" />} />
      <Route path="/login/partner" element={<LoginPage key="partner" portal="Operator" />} />
      <Route path="/partner/register" element={<PartnerRegisterPage />} />
      <Route path="/partner" element={<PartnerLayout />}>
        <Route index element={<PartnerOverviewPage />} />
        <Route path="application" element={<PartnerApplicationPage />} />
        <Route path="invitations" element={<PartnerInvitationsPage />} />
        <Route path="drivers" element={<PartnerDriversPage />} />
        <Route path="vehicles" element={<PartnerVehiclesPage />} />
        <Route path="members" element={<PartnerMembersPage />} />
        <Route path="profile" element={<PartnerProfilePage />} />
        <Route path="locations" element={<PartnerLocationsPage />} />
        <Route path="services" element={<PartnerServicesPage />} />
        <Route path="routes" element={<PartnerRoutesPage />} />
        <Route path="seat-layouts" element={<PartnerSeatLayoutsPage />} />
        <Route path="schedules" element={<PartnerSchedulesPage />} />
        <Route path="fares" element={<PartnerFaresPage />} />
        <Route path="account" element={<PartnerAccountPage />} />
        <Route path="*" element={<Navigate to="/partner" replace />} />
      </Route>
      <Route element={<Protected />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminLanding />} />
          <Route path="organizations" element={<OrganizationList />} />
          <Route path="organizations/:id" element={<OrganizationDetail />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="drivers" element={<DriversPage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="services" element={<AdminServicesPage />} />
          <Route path="services/:id" element={<AdminServiceDetailPage />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route
        path="*"
        element={
          <main className="center-page">
            <section className="recovery-card">
              <h1>Không tìm thấy trang</h1>
              <p>Đường dẫn bạn truy cập không tồn tại.</p>
              <Link className="button primary" to="/admin/organizations">
                Về trang quản trị
              </Link>
            </section>
          </main>
        }
      />
    </Routes>
  );
}
