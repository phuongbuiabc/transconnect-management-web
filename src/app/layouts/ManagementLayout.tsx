import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { Brand } from '../../shared/ui';
import { Icon, type IconName } from '../../shared/ui/Icon';
const destinations: { path: string; label: string; permission: string; icon: IconName }[] = [
  {
    path: 'organizations',
    label: 'Đơn vị vận tải',
    permission: 'organizations.manage',
    icon: 'organizations',
  },
  { path: 'drivers', label: 'Tài xế', permission: 'organizations.manage', icon: 'drivers' },
  { path: 'locations', label: 'Địa điểm', permission: 'locations.manage', icon: 'locations' },
  { path: 'accounts', label: 'Tài khoản', permission: 'users.manage', icon: 'accounts' },
];
export function AdminLayout() {
  const auth = useAuth();
  const { pathname } = useLocation();
  const visibleDestinations = destinations.filter((item) =>
    auth.user?.permissions.includes(item.permission),
  );
  const current = destinations.find((item) => pathname.startsWith('/admin/' + item.path));
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobile, setMobile] = useState(() => matchMedia('(max-width: 900px)').matches);
  const [busy, setBusy] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const media = matchMedia('(max-width: 900px)');
    const update = () => {
      setMobile(media.matches);
      if (!media.matches) setMenuOpen(false);
    };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!mobile || !menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = 'hidden';
    const controls = () =>
      Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled)') ?? [],
      ).filter((item) => getComputedStyle(item).display !== 'none');
    const focusFrame = requestAnimationFrame(() => controls()[0]?.focus());
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const items = controls();
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', onKey);
      trigger?.focus();
    };
  }, [mobile, menuOpen]);
  function closeNavigation() {
    setMenuOpen(false);
    if (mobile) requestAnimationFrame(() => document.getElementById('main-content')?.focus());
  }
  async function signOut() {
    setBusy(true);
    try {
      await auth.signOut();
    } catch {
      /* Local session already cleared. */
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="app-layout horizontal-workspace">
      <a className="skip-link" href="#main-content">
        Bỏ qua điều hướng
      </a>
      <header className="experience-header" inert={mobile && menuOpen}>
        <div className="experience-brand">
          <Link to="/admin" aria-label="VieGo, về không gian quản trị">
            <Brand light />
          </Link>
          <span>Vận hành &amp; quản trị</span>
        </div>
        <div className="experience-account">
          <span className="experience-avatar" aria-hidden="true">
            {auth.user?.fullName.charAt(0).toLocaleUpperCase('vi') || 'A'}
          </span>
          <div className="experience-user">
            <strong>{auth.user?.fullName}</strong>
            <small>Quản trị viên nội bộ</small>
          </div>
          <button
            type="button"
            className="logout-button"
            disabled={busy}
            onClick={() => void signOut()}
          >
            <Icon name="logout" />
            {busy ? 'Đang đăng xuất…' : 'Đăng xuất'}
          </button>
        </div>
      </header>
      <aside
        ref={sidebarRef}
        id="workspace-navigation"
        className={'sidebar ' + (menuOpen ? 'is-open' : '')}
        inert={mobile && !menuOpen}
        role={mobile && menuOpen ? 'dialog' : undefined}
        aria-modal={mobile && menuOpen ? true : undefined}
        aria-label="Điều hướng quản trị"
      >
        <div className="sidebar-brand-row">
          <Link className="brand-link" to="/admin" onClick={closeNavigation}>
            <Brand light />
          </Link>
          <button
            type="button"
            className="menu-close"
            aria-label="Đóng điều hướng"
            onClick={() => setMenuOpen(false)}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="workspace-switch">
          <span className="workspace-emblem">
            <Icon name="shield" />
          </span>
          <div>
            <strong>Quản trị nền tảng</strong>
            <small>Không gian nội bộ</small>
          </div>
        </div>
        <p className="workspace-label">Quản lý</p>
        <nav aria-label="Điều hướng chính">
          {visibleDestinations.map((item) => (
            <NavLink
              key={item.path}
              to={'/admin/' + item.path}
              className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
              onClick={closeNavigation}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              <Icon name="right" className="nav-current-marker" />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="brand-accent" />
          <p>
            Kết nối hành trình.
            <br />
            <strong>Quản lý từ một nơi.</strong>
          </p>
        </div>
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
      {mobile && menuOpen ? (
        <button
          type="button"
          tabIndex={-1}
          className="menu-overlay"
          aria-label="Đóng điều hướng"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <div className="app-main" inert={mobile && menuOpen}>
        <header className="topbar">
          <div className="topbar-start">
            <button
              ref={triggerRef}
              type="button"
              className="menu-toggle button secondary"
              aria-label={menuOpen ? 'Đóng điều hướng' : 'Mở điều hướng'}
              aria-controls="workspace-navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Icon name="menu" />
            </button>
            <nav className="breadcrumbs" aria-label="Đường dẫn">
              <Link to="/admin">Quản trị</Link>
              <Icon name="right" />
              <span aria-current="page">{current?.label || 'Không gian quản trị'}</span>
            </nav>
          </div>
          <span className="topbar-context">
            <Icon name="shield" /> Không gian quản trị nội bộ
          </span>
        </header>
        <main id="main-content" className="content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <strong>VieGo Management</strong>
          <span>Nền tảng kết nối vận tải</span>
        </footer>
      </div>
    </div>
  );
}
