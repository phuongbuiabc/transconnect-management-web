import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAccountSettings } from '../hooks/useAccountSettings';
import { ErrorNotice } from '../../../shared/ui';
export function AccountSettings() {
  const auth = useAuth();
  const state = useAccountSettings();
  const [name, setName] = useState(auth.user?.fullName || '');
  const [phone, setPhone] = useState(auth.user?.phoneNumber || '');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [file, setFile] = useState<File>();
  return (
    <details className="panel">
      <summary>Thông tin tài khoản / đổi mật khẩu</summary>
      {auth.user?.avatarUrl ? (
        <img src={auth.user.avatarUrl} alt="Ảnh đại diện" width="80" height="80" />
      ) : null}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void state.profile(name, phone);
        }}
      >
        <label>
          Tên hiển thị
          <input required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Số điện thoại
          <input maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <button disabled={state.busy}>Lưu thông tin</button>
      </form>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (file) void state.avatar(file);
        }}
      >
        <label>
          Ảnh đại diện (PNG/JPEG/WebP, tối đa 5 MB)
          <input
            type="file"
            required
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setFile(e.target.files?.[0])}
          />
        </label>
        <button disabled={state.busy || !file || file.size > 5242880}>Lưu ảnh</button>
      </form>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void state.password(current, next);
        }}
      >
        <label>
          Mật khẩu hiện tại
          <input
            required
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </label>
        <label>
          Mật khẩu mới
          <input
            required
            type="password"
            minLength={6}
            maxLength={100}
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </label>
        <p>Bạn cần đăng nhập lại sau khi đổi mật khẩu.</p>
        <button disabled={state.busy}>Đổi mật khẩu</button>
      </form>
      {state.error ? <ErrorNotice error={state.error} /> : null}
      {state.notice ? <p role="status">{state.notice}</p> : null}
    </details>
  );
}
