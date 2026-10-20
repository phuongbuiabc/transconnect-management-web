import { useState } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import { ErrorNotice, Loading } from '../../../shared/ui';
import { useAuth } from '../../auth/hooks/useAuth';
import { AccountDetail } from './AccountDetail';
export function AccountsPage() {
  const auth = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('');
  const [selected, setSelected] = useState<string>();
  const state = useAccounts(page, search);
  return (
    <section className="foundation-workspace">
      <h1>Quản lý tài khoản</h1>
      <label>
        Tìm tên hoặc email
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </label>
      <label>
        Lý do khóa / mở khóa
        <input value={reason} maxLength={1000} onChange={(e) => setReason(e.target.value)} />
      </label>
      {state.error ? <ErrorNotice error={state.error} /> : null}
      {state.loading ? (
        <Loading />
      ) : (
        state.data?.items.map((account) => (
          <article className="recovery-card" key={account.id}>
            <h2>{account.fullName}</h2>
            <p>
              {account.email} · {account.accountGroup}
            </p>
            <p>{account.isActive ? 'Đang hoạt động' : 'Đã khóa'}</p>
            <button
              className="button secondary"
              onClick={() => setSelected(selected === account.id ? undefined : account.id)}
            >
              Chi tiết và lịch sử
            </button>
            {selected === account.id ? (
              <AccountDetail key={String(account.isActive)} id={account.id} />
            ) : null}
            <button
              className="button secondary"
              disabled={state.busy || !reason.trim() || account.id === auth.user?.userId}
              onClick={() => void state.change(account, reason)}
            >
              {account.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
            </button>
          </article>
        ))
      )}
      {!state.loading && state.data?.totalRecords === 0 ? <p>Không có tài khoản phù hợp.</p> : null}
      <button
        className="button secondary"
        disabled={page === 1 || state.loading}
        onClick={() => setPage(page - 1)}
      >
        Trước
      </button>
      <span>
        {' '}
        Trang {page} · {state.data?.totalRecords ?? 0} tài khoản{' '}
      </span>
      <button
        className="button secondary"
        disabled={state.loading || page >= (state.data?.totalPages ?? 0)}
        onClick={() => setPage(page + 1)}
      >
        Sau
      </button>
    </section>
  );
}
