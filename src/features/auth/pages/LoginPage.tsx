import { useEffect, useRef, useState, type FormEvent } from 'react';
import { NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Brand } from '../../../shared/ui';
import { Icon } from '../../../shared/ui/Icon';
import { ApiError, errorMessage } from '../../../core/api/apiError';
import './login.css';

const systemAccounts = [
  { id: 'sysadmin', email: 'admin@hotmail.com', name: 'Sysadmin' },
  { id: 'developer', email: null, name: 'Developer' },
  { id: 'data-engineer', email: null, name: 'Data engineer' },
  { id: 'accountant', email: null, name: 'Accountant' },
];

export function LoginPage({ portal }: { portal: 'InternalAdmin' | 'Operator' }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [systemAccountId, setSystemAccountId] = useState(systemAccounts[0].id);
  const [password, setPassword] = useState('');
  const accountGroup = portal;
  const [registering, setRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  const isPartner = accountGroup === 'Operator';
  const systemAccount = systemAccounts.find((account) => account.id === systemAccountId);
  const accountUnavailable = !isPartner && !systemAccount?.email;
  const heading = registering
    ? 'Tạo tài khoản đối tác'
    : isPartner
      ? 'Đăng nhập doanh nghiệp'
      : 'Đăng nhập hệ thống';
  const action = registering ? 'Tạo tài khoản' : 'Đăng nhập';
  const fieldNames: Record<string, { id: string; label: string }> = {
    fullname: { id: 'full-name', label: 'Họ tên' },
    email: { id: 'email', label: isPartner ? 'Email' : 'Tài khoản' },
    password: { id: 'password', label: 'Mật khẩu' },
  };
  const fieldErrors = error instanceof ApiError ? error.fields : {};
  function messagesFor(field: string) {
    return Object.entries(fieldErrors)
      .filter(([name]) => name.toLowerCase() === field.toLowerCase())
      .flatMap(([, messages]) => messages);
  }
  function inlineError(field: string, id: string) {
    const messages = messagesFor(field);
    return messages.length ? (
      <p className="login-field-error" id={id}>
        {messages.join(' ')}
      </p>
    ) : null;
  }
  if (auth.user)
    return <Navigate to={auth.user.accountGroup === 'Operator' ? '/partner' : '/admin'} replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const loginEmail = isPartner ? email.trim() : systemAccount?.email;
    if (busy || !loginEmail) return;
    setBusy(true);
    setError(null);
    try {
      if (registering) await auth.register(email.trim(), password, fullName);
      else await auth.signIn(loginEmail, password, accountGroup);
      navigate(accountGroup === 'Operator' ? '/partner' : '/admin', {
        replace: true,
      });
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className={`access-page ${isPartner ? 'access-partner' : 'access-admin'}`}>
      <header className="access-header">
        <Brand />
        <span>Nền tảng kết nối vận tải</span>
      </header>
      <div className="access-content">
        <section className="access-intro" aria-labelledby="access-title">
          <h2 id="access-title">
            {isPartner ? 'Kết nối doanh nghiệp.' : 'Quản trị tập trung.'}
            <br />
            <em>{isPartner ? 'Đồng hành cùng VieGo.' : 'Vận hành thông suốt.'}</em>
          </h2>
          <p>
            {isPartner
              ? 'Không gian dành cho đơn vị vận tải: bắt đầu với tài khoản đối tác và hồ sơ doanh nghiệp của bạn.'
              : 'Không gian riêng cho đội ngũ quản trị tài khoản, đơn vị vận tải và hồ sơ trên VieGo.'}
          </p>
          <nav className="access-portals" aria-label="Trang đăng nhập">
            {[
              {
                value: 'Operator',
                title: 'Doanh nghiệp vận tải',
                description: 'Tài khoản đối tác và hồ sơ đơn vị vận tải.',
                icon: 'organizations' as const,
              },
              {
                value: 'InternalAdmin',
                title: 'Quản trị hệ thống',
                description: 'Dành cho đội ngũ quản trị nội bộ VieGo.',
                icon: 'shield' as const,
              },
            ].map((portal) => (
              <NavLink
                className="access-portal"
                key={portal.value}
                to={portal.value === 'Operator' ? '/login/partner' : '/login/admin'}
                aria-disabled={busy || undefined}
                onClick={(event) => {
                  if (busy) event.preventDefault();
                }}
              >
                <Icon name={portal.icon} />
                <span>
                  <strong>{portal.title}</strong>
                  <small>{portal.description}</small>
                </span>
                <span className="access-selection" aria-hidden="true">
                  <Icon name="check" />
                </span>
              </NavLink>
            ))}
          </nav>
          <div className="access-partner-note">
            <Icon name="document" />
            <p>
              <strong>Muốn trở thành đối tác VieGo?</strong>
              <br />
              Chọn Doanh nghiệp vận tải, tạo tài khoản và hoàn thiện hồ sơ đơn vị của bạn.
            </p>
          </div>
        </section>
        <section className="access-form-area" aria-labelledby="login-title">
          <div className="login-card">
            <div className="access-form-icon">
              <Icon name={isPartner ? 'organizations' : 'shield'} />
            </div>
            <h1 id="login-title">{heading}</h1>
            <p>
              {registering
                ? 'Tạo tài khoản để bắt đầu đăng ký đơn vị vận tải trên VieGo.'
                : isPartner
                  ? 'Truy cập không gian làm việc dành cho đối tác vận tải.'
                  : 'Chọn tài khoản quản trị và nhập mật khẩu để tiếp tục.'}
            </p>
            <form onSubmit={submit} aria-busy={busy}>
              {error ? (
                <div
                  className="notice error login-error"
                  id="login-error"
                  role="alert"
                  tabIndex={-1}
                  ref={errorRef}
                >
                  <strong>Chưa thể {registering ? 'tạo tài khoản' : 'đăng nhập'}</strong>
                  <p>{errorMessage(error)}</p>
                  {Object.keys(fieldErrors).length ? (
                    <ul>
                      {Object.entries(fieldErrors).flatMap(([field, messages]) => {
                        const target = fieldNames[field.toLowerCase()];
                        return messages.map((message, index) => (
                          <li key={field + index}>
                            {target ? (
                              <a href={'#' + target.id}>
                                {target.label}: {message}
                              </a>
                            ) : (
                              message
                            )}
                          </li>
                        ));
                      })}
                    </ul>
                  ) : null}
                </div>
              ) : null}
              {registering ? (
                <div className="login-field">
                  <label htmlFor="full-name">Họ tên</label>
                  <input
                    id="full-name"
                    autoComplete="name"
                    disabled={busy}
                    required
                    maxLength={200}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    aria-invalid={messagesFor('fullName').length ? true : undefined}
                    aria-describedby={
                      messagesFor('fullName').length ? 'full-name-error' : undefined
                    }
                  />
                  {inlineError('fullName', 'full-name-error')}
                </div>
              ) : null}
              <label htmlFor="email">{isPartner ? 'Email doanh nghiệp' : 'Tài khoản'}</label>
              {isPartner ? (
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  maxLength={256}
                  required
                  placeholder="ten@donvi.vn"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={busy}
                  aria-invalid={messagesFor('email').length ? true : undefined}
                  aria-describedby={messagesFor('email').length ? 'email-error' : undefined}
                />
              ) : (
                <div className="system-account-select">
                  <Icon name="accounts" />
                  <select
                    id="email"
                    autoComplete="username"
                    value={systemAccountId}
                    disabled={busy}
                    required
                    onChange={(event) => {
                      setSystemAccountId(event.target.value);
                      setPassword('');
                      setPasswordVisible(false);
                      setError(null);
                    }}
                    aria-invalid={messagesFor('email').length ? true : undefined}
                    aria-describedby={
                      [
                        messagesFor('email').length ? 'email-error' : '',
                        accountUnavailable ? 'system-account-status' : '',
                      ]
                        .filter(Boolean)
                        .join(' ') || undefined
                    }
                  >
                    {systemAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                  <Icon name="right" className="system-account-chevron" />
                </div>
              )}
              {inlineError('email', 'email-error')}
              {accountUnavailable ? (
                <p className="system-account-status" id="system-account-status" role="status">
                  {systemAccount?.name ?? 'Tài khoản này'} chưa được thiết lập. Vui lòng chọn
                  Sysadmin để đăng nhập.
                </p>
              ) : null}
              <label htmlFor="password">Mật khẩu</label>
              <div className="password-field">
                <input
                  id="password"
                  type={passwordVisible ? 'text' : 'password'}
                  autoComplete={registering ? 'new-password' : 'current-password'}
                  required
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={busy || accountUnavailable}
                  aria-invalid={messagesFor('password').length ? true : undefined}
                  aria-describedby={messagesFor('password').length ? 'password-error' : undefined}
                />
                <button
                  className="password-toggle"
                  type="button"
                  disabled={busy || accountUnavailable}
                  aria-label={passwordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  aria-pressed={passwordVisible}
                  aria-controls="password"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  {passwordVisible ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
              {inlineError('password', 'password-error')}
              <button
                type="submit"
                className="button primary login-submit"
                disabled={busy || accountUnavailable}
              >
                {busy ? (registering ? 'Đang tạo tài khoản…' : 'Đang đăng nhập…') : action}
                <Icon name="arrow" />
              </button>
              <span className="sr-only" role="status">
                {busy
                  ? registering
                    ? 'Đang tạo tài khoản, vui lòng chờ.'
                    : 'Đang đăng nhập, vui lòng chờ.'
                  : ''}
              </span>
            </form>
            {isPartner ? (
              <div className="access-register">
                <span>
                  {registering ? 'Đã có tài khoản đối tác?' : 'Chưa có tài khoản đối tác?'}
                </span>
                <button
                  type="button"
                  className="text-link"
                  disabled={busy}
                  onClick={() => {
                    setRegistering(!registering);
                    setError(null);
                    setPasswordVisible(false);
                  }}
                >
                  {registering ? 'Đăng nhập' : 'Tạo tài khoản'}
                </button>
              </div>
            ) : null}
            <p className="session-note">
              <Icon name="shield" />
              Tự động khôi phục đăng nhập trên trình duyệt này.
            </p>
            <p className="login-help">
              {isPartner
                ? registering
                  ? 'Sau khi tạo tài khoản, xác thực email để tiếp tục nộp hồ sơ đơn vị vận tải.'
                  : 'Dùng tài khoản đối tác để quản lý hồ sơ và các đơn vị bạn tham gia.'
                : 'Tài khoản quản trị được cấp bởi hệ thống. Liên hệ người phụ trách nếu bạn cần hỗ trợ truy cập.'}
            </p>
          </div>
        </section>
      </div>
      <footer className="access-footer">
        <span>VieGo · Cùng kết nối, cùng phát triển.</span>
        <span>Không gian dành cho doanh nghiệp & đội ngũ quản trị</span>
      </footer>
    </main>
  );
}
