import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { Protected } from './router/Protected';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { OrganizationList } from '../features/organizations/pages/OrganizationListPage';
import { OrganizationDetail } from '../features/organizations/pages/OrganizationDetailPage';
import { AccountsPage } from '../features/accounts/pages/AccountsPage';
import { DriversPage } from '../features/foundation/pages/DriversPage';
import { PartnerPage } from '../features/organizations/pages/PartnerPage';
import { useAuth } from '../features/auth/hooks/useAuth';
function AdminLanding() {
  const auth = useAuth();
  return (
    <Navigate
      to={auth.user?.permissions.includes('organizations.manage') ? 'organizations' : 'accounts'}
      replace
    />
  );
}
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/partner" element={<PartnerPage />} />
      <Route element={<Protected />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminLanding />} />
          <Route path="organizations" element={<OrganizationList />} />
          <Route path="organizations/:id" element={<OrganizationDetail />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="drivers" element={<DriversPage />} />
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
