import { Fragment, useState } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import { ErrorNotice, Loading } from '../../../shared/ui';
import { Icon } from '../../../shared/ui/Icon';
import { EmptyRecords, EntityName, PageHeader, Pagination } from '../../../shared/ui/RecordLayout';
import { useAuth } from '../../auth/hooks/useAuth';
import { AccountDetail } from './AccountDetail';
const groups: Record<string, string> = {
  Customer: 'Khách hàng',
  Operator: 'Đối tác',
  InternalAdmin: 'Quản trị nội bộ',
};
export function AccountsPage() {
  const auth = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('');
  const [selected, setSelected] = useState<string>();
  const state = useAccounts(page, search);
  return (
    <section className="records-page">
      <PageHeader
        title="Tài khoản"
        description="Tra cứu người dùng, quản lý quyền truy cập và xem lịch sử tài khoản."
      />
      <section className="panel" aria-label="Danh sách tài khoản" aria-busy={state.loading}>
        <div className="panel-toolbar">
          <div>
            <h2>Người dùng hệ thống</h2>
            <p>Trạng thái tài khoản độc lập với trạng thái xét duyệt hồ sơ.</p>
          </div>
        </div>
        <div className="filters">
          <label className="search-label">
            <span className="filter-caption">Tìm kiếm người dùng</span>
            <span className="search-control">
              <Icon name="search" />
              <input
                type="search"
                value={search}
                placeholder="Tên hoặc email…"
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </span>
          </label>
        </div>
        <label className="review-note-field">
          Lý do khóa / mở khóa
          <input
            value={reason}
            maxLength={1000}
            placeholder="Nhập lý do trước khi thay đổi trạng thái tài khoản"
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        {state.error ? <ErrorNotice error={state.error} /> : null}
        {state.loading ? (
          <Loading />
        ) : state.data?.items.length ? (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Bảng tài khoản, có thể cuộn ngang"
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">Người dùng</th>
                  <th scope="col">Nhóm tài khoản</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {state.data.items.map((account) => (
                  <Fragment key={account.id}>
                    <tr>
                      <td>
                        <EntityName name={account.fullName} secondary={account.email} />
                      </td>
                      <td>{groups[account.accountGroup] || account.accountGroup}</td>
                      <td>
                        <span
                          className={
                            'status ' + (account.isActive ? 'status-approved' : 'status-rejected')
                          }
                        >
                          <span />
                          {account.isActive ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td>
                        <div className="record-actions">
                          <button
                            type="button"
                            className="text-link"
                            aria-expanded={selected === account.id}
                            onClick={() =>
                              setSelected(selected === account.id ? undefined : account.id)
                            }
                          >
                            Chi tiết
                            <Icon name="right" />
                          </button>
                          <button
                            type="button"
                            className="button secondary"
                            disabled={
                              state.busy || !reason.trim() || account.id === auth.user?.userId
                            }
                            onClick={() => void state.change(account, reason)}
                          >
                            {account.isActive ? 'Khóa' : 'Mở khóa'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {selected === account.id ? (
                      <tr>
                        <td colSpan={4} className="record-expanded">
                          <AccountDetail key={String(account.isActive)} id={account.id} />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : !state.error ? (
          <EmptyRecords
            title="Không có tài khoản phù hợp"
            description="Thử tìm theo tên hoặc địa chỉ email khác."
          />
        ) : null}
      </section>
      <Pagination
        page={page}
        totalPages={state.data?.totalPages ?? 0}
        total={state.data?.totalRecords ?? 0}
        loading={state.loading || state.busy}
        onChange={setPage}
      />
    </section>
  );
}
