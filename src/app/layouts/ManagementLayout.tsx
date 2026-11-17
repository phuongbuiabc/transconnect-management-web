import { useEffect, useRef, useState, type ReactNode } from 'react';
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
  { path: 'services', label: 'Dịch vụ', permission: 'services.review', icon: 'shield' },
  { path: 'locations', label: 'Địa điểm', permission: 'locations.manage', icon: 'locations' },
  { path: 'accounts', label: 'Tài khoản', permission: 'users.manage', icon: 'accounts' },
];
export interface ShellDestination {
  path: string;
  label: string;
  icon: IconName;
  end?: boolean;
}
export function AdminLayout() {
  const auth = useAuth();
  return (
    <WorkspaceShell
      basePath="/admin"
      rootLabel="Quản trị"
      caption="Vận hành & quản trị"
      roleLabel="Quản trị viên nội bộ"
      workspaceTitle="Quản trị nền tảng"
      workspaceSubtitle="Không gian nội bộ"
      contextLabel="Không gian quản trị nội bộ"
      navigationLabel="Điều hướng quản trị"
      destinations={destinations
        .filter((item) => auth.user?.permissions.includes(item.permission))
        .map((item) => ({ path: '/admin/' + item.path, label: item.label, icon: item.icon }))}
    />
  );
}
/** Presentation shell shared by Admin and Partner; destinations are decided by the caller. */
export function WorkspaceShell({
  basePath,
  rootLabel,
  caption,
  roleLabel,
  workspaceTitle,
  workspaceSubtitle,
  contextLabel,
  navigationLabel,
  destinations: visibleDestinations,
  children,
}: {
  basePath: string;
  rootLabel: string;
  caption: string;
  roleLabel: string;
  workspaceTitle: string;
  workspaceSubtitle: string;
  contextLabel: string;
  navigationLabel: string;
  destinations: ShellDestination[];
  children?: ReactNode;
}) {
  const auth = useAuth();
  const { pathname } = useLocation();
  const current =
    visibleDestinations.find((item) => !item.end && pathname.startsWith(item.path)) ||
    visibleDestinations.find((item) => pathname === item.path);
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
          <Link to={basePath} aria-label={'VieGo, về ' + workspaceTitle.toLocaleLowerCase('vi')}>
            <Brand light />
          </Link>
          <span>{caption}</span>
        </div>
        <div className="experience-account">
          <span className="experience-avatar" aria-hidden="true">
            {auth.user?.fullName.charAt(0).toLocaleUpperCase('vi') || 'A'}
          </span>
          <div className="experience-user">
            <strong>{auth.user?.fullName}</strong>
            <small>{roleLabel}</small>
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
        aria-label={navigationLabel}
      >
        <div className="sidebar-brand-row">
          <Link className="brand-link" to={basePath} onClick={closeNavigation}>
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
            <strong>{workspaceTitle}</strong>
            <small>{workspaceSubtitle}</small>
          </div>
        </div>
        <p className="workspace-label">Quản lý</p>
        <nav aria-label="Điều hướng chính">
          {visibleDestinations.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
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
            <small>{roleLabel}</small>
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
              <Link to={basePath}>{rootLabel}</Link>
              <Icon name="right" />
              <span aria-current="page">{current?.label || workspaceTitle}</span>
            </nav>
          </div>
          <span className="topbar-context">
            <Icon name="shield" /> {contextLabel}
          </span>
        </header>
        <main id="main-content" className="content" tabIndex={-1}>
          {children ?? <Outlet />}
        </main>
        <footer className="app-footer">
          <strong>VieGo Management</strong>
          <span>Nền tảng kết nối vận tải</span>
        </footer>
      </div>
    </div>
  );
}
