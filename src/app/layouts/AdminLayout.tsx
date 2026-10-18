import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { Brand } from '../../shared/ui';
export function AdminLayout() {
  const auth = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    try {
      await auth.signOut();
    } catch {
      /* Local session has already been cleared. */
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">
        Bỏ qua điều hướng
      </a>
      <aside className={'sidebar ' + (menuOpen ? 'is-open' : '')}>
        <Link className="brand-link" to="/admin/organizations" onClick={() => setMenuOpen(false)}>
          <Brand />
        </Link>
        <div className="workspace-label">KHÔNG GIAN QUẢN TRỊ</div>
        <nav aria-label="Điều hướng chính">
          <Link
            aria-current="page"
            className="nav-item active"
            to="/admin/organizations"
            onClick={() => setMenuOpen(false)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 21V7l8-4 8 4v14M9 21v-5h6v5M8 9h1m6 0h1M8 12h1m6 0h1M2 21h20" />
            </svg>
            Đơn vị vận tải
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <span className="avatar">
            {auth.user?.fullName.charAt(0).toLocaleUpperCase('vi') || 'A'}
          </span>
          <div>
            <strong>{auth.user?.fullName}</strong>
            <small>Quản trị viên nội bộ</small>
          </div>
        </div>
      </aside>
      {menuOpen ? (
        <button
          className="menu-overlay"
          aria-label="Đóng điều hướng"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-start">
            <button
              className="menu-toggle button secondary"
              aria-label="Mở điều hướng"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              ☰
            </button>
            <span>
              Quản trị nền tảng <span className="breadcrumb-divider">/</span>{' '}
              <strong>Đối tác vận tải</strong>
            </span>
          </div>
          <button className="logout-button" disabled={busy} onClick={() => void signOut()}>
            {busy ? 'Đang đăng xuất…' : 'Đăng xuất'} <span aria-hidden="true">↗</span>
          </button>
        </header>
        <main id="main-content" className="content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          TransConnect Management<span>Nền tảng quản lý đối tác vận tải</span>
        </footer>
      </div>
    </div>
  );
}
