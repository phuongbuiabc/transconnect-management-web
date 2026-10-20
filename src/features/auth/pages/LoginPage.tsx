import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Brand, ErrorNotice } from '../../../shared/ui';
export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountGroup, setAccountGroup] = useState('InternalAdmin');
  const [registering, setRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  if (auth.user)
    return <Navigate to={auth.user.accountGroup === 'Operator' ? '/partner' : '/admin'} replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (registering) await auth.register(email.trim(), password, fullName);
      else await auth.signIn(email.trim(), password, accountGroup);
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
    <main className="login-layout">
      <section className="login-story">
        <Brand light />
        <div className="story-copy">
          <p className="eyebrow">KẾT NỐI ĐỐI TÁC. MỞ RỘNG HÀNH TRÌNH.</p>
          <h1>
            Mỗi kết nối tốt
            <br />
            bắt đầu từ sự
            <br />
            <em>tin cậy.</em>
          </h1>
          <p>
            Không gian quản trị dành cho đội ngũ TransConnect. Cùng xây dựng mạng lưới vận tải đáng
            tin cậy.
          </p>
        </div>
        <div className="road-art" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <small className="story-footer">TransConnect · Nền tảng kết nối vận tải</small>
      </section>
      <section className="login-form-area">
        <div className="mobile-brand">
          <Brand />
        </div>
        <div className="login-card">
          <span className="section-tag">CỔNG QUẢN TRỊ</span>
          <h2>Chào mừng trở lại</h2>
          <p>Đăng nhập bằng tài khoản quản trị nội bộ.</p>
          <form onSubmit={submit}>
            <label>
              Cổng đăng nhập
              <select
                value={accountGroup}
                disabled={busy}
                onChange={(e) => {
                  setAccountGroup(e.target.value);
                  setRegistering(false);
                }}
              >
                <option value="InternalAdmin">Quản trị nội bộ</option>
                <option value="Operator">Đối tác vận tải</option>
              </select>
            </label>
            {accountGroup === 'Operator' ? (
              <label>
                <input
                  type="checkbox"
                  checked={registering}
                  disabled={busy}
                  onChange={(e) => setRegistering(e.target.checked)}
                />
                Tạo tài khoản mới
              </label>
            ) : null}
            {registering ? (
              <label>
                Họ tên
                <input
                  required
                  maxLength={200}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </label>
            ) : null}
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              maxLength={256}
              required
              placeholder="Email quản trị của bạn"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={busy}
            />
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={busy}
            />
            {error ? <ErrorNotice error={error} /> : null}
            <button className="button primary login-submit" disabled={busy}>
              {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
              <span aria-hidden="true">→</span>
            </button>
          </form>
          <p className="login-help">
            Tài khoản được cấp bởi quản trị hệ thống. Liên hệ người phụ trách nếu bạn cần hỗ trợ
            truy cập.
          </p>
        </div>
        <small className="login-footer">Kết nối an toàn · Quản lý tập trung</small>
      </section>
    </main>
  );
}
