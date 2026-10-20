import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { session } from '../../core/api/client';
import { errorMessage } from '../../core/api/apiError';
import { Brand, ErrorNotice, Loading } from '../../shared/ui';
export function Protected() {
  const auth = useAuth();
  const location = useLocation();
  if (auth.loading)
    return (
      <main className="center-page">
        <Loading text="Đang xác minh phiên đăng nhập…" />
      </main>
    );
  if (!auth.user) {
    if (auth.error && session.hasTokens())
      return (
        <main className="center-page">
          <div className="recovery-card">
            <Brand />
            <ErrorNotice error={auth.error} retry={() => void auth.restore()} />
            <button className="button secondary" onClick={() => session.clear()}>
              Quay lại đăng nhập
            </button>
          </div>
        </main>
      );
    return <Navigate to="/login" replace />;
  }
  if (
    auth.user.accountGroup !== 'InternalAdmin' ||
    !(location.pathname === '/admin'
      ? auth.user.permissions.some((permission) =>
          ['organizations.manage', 'users.manage'].includes(permission),
        )
      : auth.user.permissions.includes(
          location.pathname.startsWith('/admin/accounts') ? 'users.manage' : 'organizations.manage',
        ))
  )
    return <Denied />;
  return <Outlet />;
}
function Denied() {
  const auth = useAuth();
  const [notice, setNotice] = useState('');
  return (
    <main className="center-page">
      <section className="recovery-card">
        <Brand />
        <span className="section-tag">TRUY CẬP GIỚI HẠN</span>
        <h1>Không đủ quyền truy cập</h1>
        <p>Tài khoản cần thuộc nhóm quản trị nội bộ và được cấp quyền phù hợp với trang này.</p>
        {notice ? <p role="alert">{notice}</p> : null}
        <button
          className="button primary"
          onClick={() => void auth.signOut().catch((error) => setNotice(errorMessage(error)))}
        >
          Đăng xuất
        </button>
      </section>
    </main>
  );
}
