import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorNotice, Loading } from '../../../shared/ui';
import { Icon } from '../../../shared/ui/Icon';
import { EmptyRecords, EntityName, PageHeader, Pagination } from '../../../shared/ui/RecordLayout';
import { Status, statusLabels } from '../components/OrganizationStatus';
import { useOrganizations } from '../hooks/useOrganizations';
export function OrganizationList() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const { items, total, totalPages, loading, error, reload } = useOrganizations(
    page,
    query,
    status,
  );
  const filtering = !!query.trim() || status !== 'all';
  return (
    <>
      <PageHeader
        title="Đơn vị vận tải"
        description="Tiếp nhận, xem xét và quản lý hồ sơ đối tác vận tải."
        action={
          <button type="button" className="button secondary" disabled={loading} onClick={reload}>
            <Icon name="refresh" />
            Làm mới
          </button>
        }
      />
      <section className="panel" aria-label="Danh sách đơn vị vận tải" aria-busy={loading}>
        <div className="panel-toolbar">
          <div>
            <h2>Hồ sơ đối tác</h2>
            <p>Thông tin đăng ký và trạng thái xét duyệt.</p>
          </div>
          <span className="count">
            {loading ? 'Đang tải' : `${total.toLocaleString('vi-VN')} hồ sơ`}
          </span>
        </div>
        <div className="filters">
          <label className="search-label">
            <span className="filter-caption">Tìm kiếm hồ sơ</span>
            <span className="search-control">
              <Icon name="search" />
              <input
                type="search"
                placeholder="Tên đơn vị, mã đăng ký, email…"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
              />
            </span>
          </label>
          <label>
            <span className="filter-caption">Trạng thái</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">Tất cả trạng thái</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorNotice error={error} retry={reload} />
        ) : items.length === 0 ? (
          <EmptyRecords
            title={filtering ? 'Không có hồ sơ phù hợp' : 'Chưa có hồ sơ đăng ký'}
            description={
              filtering
                ? 'Thử thay đổi từ khóa hoặc trạng thái hồ sơ.'
                : 'Hồ sơ đăng ký của đơn vị vận tải sẽ xuất hiện tại đây.'
            }
          />
        ) : (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Bảng hồ sơ đối tác, có thể cuộn ngang"
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">Đơn vị vận tải</th>
                  <th scope="col">Email chủ sở hữu</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col">
                    <span className="sr-only">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <EntityName
                        name={item.name}
                        secondary={'Mã đăng ký: ' + item.registrationNumber}
                      >
                        <Link className="organization-name" to={'/admin/organizations/' + item.id}>
                          {item.name}
                        </Link>
                      </EntityName>
                    </td>
                    <td>{item.ownerEmail}</td>
                    <td>
                      <Status value={item.reviewStatus} />
                    </td>
                    <td>
                      <Link className="text-link" to={'/admin/organizations/' + item.id}>
                        Xem hồ sơ
                        <Icon name="arrow" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error ? (
          <div className="table-footer">
            <span>Hiển thị {items.length} hồ sơ trên trang này</span>
            <span>Dữ liệu được phân trang từ máy chủ</span>
          </div>
        ) : null}
      </section>
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        loading={loading}
        onChange={setPage}
      />
      <aside className="info-strip">
        <Icon name="info" />
        <p>
          <strong>Xét duyệt hồ sơ.</strong> Chỉ hồ sơ đang chờ duyệt mới có thể được duyệt hoặc từ
          chối. Người nộp nhận quyền Owner; hồ sơ nộp thay sử dụng lời mời qua email.
        </p>
      </aside>
    </>
  );
}
