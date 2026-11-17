import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../../core/api/apiError';
import { ErrorNotice } from '../../../shared/ui';
import { useAuth } from '../../auth/hooks/useAuth';

function fieldMessages(error: unknown, field: string) {
  if (!(error instanceof ApiError)) return [];
  return Object.entries(error.fields)
    .filter(([name]) => name.toLowerCase() === field.toLowerCase())
    .flatMap(([, messages]) => messages);
}

/** Bước 1: tạo tài khoản Operator (POST /auth/register), phiên được lưu như đăng nhập. */
export function AccountStep() {
  const auth = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await auth.register(email.trim(), password, fullName.trim());
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  const field = (name: string, id: string) => {
    const messages = fieldMessages(error, name);
    return {
      invalid: messages.length ? true : undefined,
      describedBy: messages.length ? id : undefined,
      node: messages.length ? (
        <p className="reg-field-error" id={id}>
          {messages.join(' ')}
        </p>
      ) : null,
    };
  };
  const nameError = field('fullName', 'reg-name-error');
  const emailError = field('email', 'reg-email-error');
  const passwordError = field('password', 'reg-password-error');
  return (
    <form className="reg-card" onSubmit={submit} aria-busy={busy}>
      <h2>Tạo tài khoản đối tác</h2>
      <p className="reg-lead">
        Tài khoản này sẽ là người nộp hồ sơ và nhận quyền Owner khi đơn vị được duyệt.
      </p>
      {error ? <ErrorNotice error={error} /> : null}
      <label className="reg-field">
        Họ tên người đại diện
        <input
          autoComplete="name"
          required
          maxLength={200}
          disabled={busy}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          aria-invalid={nameError.invalid}
          aria-describedby={nameError.describedBy}
        />
        {nameError.node}
      </label>
      <label className="reg-field">
        Email
        <input
          type="email"
          autoComplete="username"
          required
          maxLength={256}
          placeholder="ten@donvi.vn"
          disabled={busy}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={emailError.invalid}
          aria-describedby={emailError.describedBy}
        />
        <small>Mã xác thực sẽ được gửi tới email này.</small>
        {emailError.node}
      </label>
      <div className="reg-field">
        <label htmlFor="reg-password">Mật khẩu</label>
        <div className="password-field">
          <input
            id="reg-password"
            type={visible ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={6}
            maxLength={100}
            disabled={busy}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={passwordError.invalid}
            aria-describedby={passwordError.describedBy ?? 'reg-password-hint'}
          />
          <button
            type="button"
            className="password-toggle"
            disabled={busy}
            aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-pressed={visible}
            aria-controls="reg-password"
            onClick={() => setVisible(!visible)}
          >
            {visible ? 'Ẩn' : 'Hiện'}
          </button>
        </div>
        <small id="reg-password-hint">Từ 6 đến 100 ký tự.</small>
        {passwordError.node}
      </div>
      <div className="reg-actions">
        <button className="button primary" disabled={busy}>
          {busy ? 'Đang tạo tài khoản…' : 'Tạo tài khoản và tiếp tục'}
        </button>
      </div>
      <p className="reg-switch">
        Đã có tài khoản đối tác? <Link to="/login/partner">Đăng nhập</Link> — bạn sẽ được đưa về
        đúng bước đang dở.
      </p>
    </form>
  );
}

const resendSeconds = 60;

/** Bước 2: xác thực email bằng OTP; bắt buộc trước khi khai thông tin doanh nghiệp (D2). */
export function VerifyStep() {
  const auth = useAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState('');
  const [wait, setWait] = useState(0);
  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);
  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !code.trim()) return;
    setBusy(true);
    setError(null);
    setNotice('');
    try {
      await auth.verify(code.trim());
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    if (busy || wait > 0) return;
    setBusy(true);
    setError(null);
    setNotice('');
    try {
      await auth.resend();
      setNotice('Đã yêu cầu gửi mã mới. Kiểm tra hộp thư, kể cả mục Spam.');
      setWait(resendSeconds);
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="reg-card" onSubmit={verify} aria-busy={busy}>
      <h2>Xác thực email</h2>
      <p className="reg-lead">
        Nhập mã đã gửi tới <strong>{auth.user?.email}</strong>. Cần xác thực trước khi khai thông
        tin doanh nghiệp.
      </p>
      {error ? <ErrorNotice error={error} /> : null}
      <label className="reg-field">
        Mã xác thực
        <input
          className="reg-otp"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={12}
          disabled={busy}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </label>
      <p className="reg-status" role="status">
        {notice}
      </p>
      <div className="reg-actions">
        <button className="button primary" disabled={busy || !code.trim()}>
          {busy ? 'Đang xử lý…' : 'Xác thực'}
        </button>
        <button
          type="button"
          className="button secondary"
          disabled={busy || wait > 0}
          onClick={() => void resend()}
        >
          {wait > 0 ? `Gửi lại mã sau ${wait}s` : 'Gửi lại mã'}
        </button>
      </div>
      <p className="reg-switch">
        Nhập nhầm email?{' '}
        <button type="button" className="text-link" onClick={() => void auth.signOut()}>
          Đăng xuất và tạo lại
        </button>
      </p>
    </form>
  );
}
