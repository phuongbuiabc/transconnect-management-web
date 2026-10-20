import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useOrganizations } from '../hooks/useOrganizations';
import { useApplication } from '../hooks/useApplication';
import { ErrorNotice, Loading } from '../../../shared/ui';
import { PartnerWorkspace } from '../../foundation/pages/PartnerWorkspace';
import { AccountSettings } from '../../auth/pages/AccountSettings';
import { ReviewHistory } from '../../foundation/components/ReviewHistory';
export function PartnerPage() {
  const auth = useAuth();
  if (auth.loading) return <Loading />;
  if (!auth.user) return <Navigate to="/login" replace />;
  if (auth.user.accountGroup !== 'Operator') return <Navigate to="/admin" replace />;
  return <PartnerContent />;
}
function PartnerContent() {
  const auth = useAuth();
  const [page, setPage] = useState(1);
  const organizations = useOrganizations(page);
  const application = useApplication(organizations.reload);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [id, setId] = useState<string>();
  const [code, setCode] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  async function verify(resend: boolean) {
    setBusy(true);
    setError(null);
    setNotice('');
    try {
      if (resend) {
        await auth.resend();
        setNotice('Đã yêu cầu gửi mã. Kiểm tra hộp thư.');
      } else await auth.verify(code);
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="content foundation-workspace">
      <h1>Cổng đối tác vận tải</h1>
      <p>{auth.user?.fullName}</p>
      <AccountSettings />
      {auth.user?.emailVerified ? <PartnerWorkspace /> : null}
      <button className="button secondary" onClick={() => void auth.signOut().catch(setError)}>
        Đăng xuất
      </button>
      {error ? <ErrorNotice error={error} /> : null}
      {notice ? <p role="status">{notice}</p> : null}
      {!auth.user?.emailVerified ? (
        <section className="recovery-card">
          <h2>Xác thực email để nộp hồ sơ</h2>
          <label>
            Mã xác thực
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="one-time-code"
            />
          </label>
          <button disabled={busy || !code} onClick={() => void verify(false)}>
            Xác thực
          </button>
          <button disabled={busy} onClick={() => void verify(true)}>
            Gửi lại mã
          </button>
        </section>
      ) : (
        <form
          className="recovery-card"
          onSubmit={(e) => {
            e.preventDefault();
            void application.submit(name, number, id);
          }}
        >
          <h2>{id ? 'Sửa và nộp lại hồ sơ' : 'Đăng ký tổ chức'}</h2>
          <label>
            Tên tổ chức
            <input
              required
              maxLength={200}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Mã số thuế
            <input
              required
              pattern="[0-9]{10}([0-9]{3})?"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </label>
          {application.error ? <ErrorNotice error={application.error} /> : null}
          <button className="button primary" disabled={application.busy}>
            {application.busy ? 'Đang gửi…' : 'Nộp hồ sơ'}
          </button>
          {id ? (
            <button
              type="button"
              onClick={() => {
                setId(undefined);
                setName('');
                setNumber('');
              }}
            >
              Hủy sửa
            </button>
          ) : null}
        </form>
      )}
      <h2>Hồ sơ của bạn</h2>
      <button disabled={organizations.loading || page === 1} onClick={() => setPage(page - 1)}>
        Trước
      </button>{' '}
      Trang {page}
      <button
        disabled={organizations.loading || page >= organizations.totalPages}
        onClick={() => setPage(page + 1)}
      >
        Sau
      </button>
      {organizations.error ? (
        <ErrorNotice error={organizations.error} retry={organizations.reload} />
      ) : null}
      {organizations.loading ? (
        <Loading />
      ) : (
        organizations.items.map((org) => (
          <article className="recovery-card" key={org.id}>
            <h3>{org.name}</h3>
            <p>
              {org.registrationNumber} · {org.reviewStatus}
            </p>
            <p>{org.reviewNote}</p>
            <ReviewHistory key={org.reviewStatus} type="organizations" id={org.id} />
            {org.reviewStatus === 'Rejected' ? (
              <button
                className="button secondary"
                onClick={() => {
                  setId(org.id);
                  setName(org.name);
                  setNumber(org.registrationNumber);
                }}
              >
                Sửa và nộp lại
              </button>
            ) : null}
          </article>
        ))
      )}
    </main>
  );
}
