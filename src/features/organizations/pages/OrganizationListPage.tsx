import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorNotice, Loading } from '../../../shared/ui';
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
  const filtered = items;
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">QUẢN LÝ ĐỐI TÁC</p>
          <h1>Đơn vị vận tải</h1>
          <p>Kiểm tra hồ sơ và tiếp nhận đối tác vào hệ thống.</p>
        </div>
        <button className="button secondary" disabled={loading} onClick={reload}>
          ↻ Làm mới
        </button>
      </div>
      <section className="panel">
        <div className="panel-toolbar">
          <div>
            <h2>Danh sách hồ sơ</h2>
            <p>Tìm kiếm và phân trang theo dữ liệu máy chủ.</p>
          </div>
          <span className="count">{loading ? 'Đang tải' : items.length + ' hồ sơ đã tải'}</span>
        </div>
        <div className="filters">
          <label className="search-label">
            <span className="sr-only">Tìm trong hồ sơ đã tải</span>
            <input
              type="search"
              placeholder="Tìm tên, mã đăng ký, email…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <label>
            <span className="sr-only">Trạng thái hồ sơ</span>
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
        ) : filtered.length === 0 ? (
          <div className="state">
            <h3>{items.length ? 'Không có hồ sơ phù hợp' : 'Chưa có hồ sơ đăng ký'}</h3>
            <p>
              {items.length
                ? 'Thử thay đổi từ khóa hoặc trạng thái.'
                : 'Hồ sơ đăng ký của đơn vị vận tải sẽ xuất hiện tại đây.'}
            </p>
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Đơn vị vận tải</th>
                    <th>Email chủ sở hữu</th>
                    <th>Trạng thái</th>
                    <th>
                      <span className="sr-only">Thao tác</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link className="organization-name" to={'/admin/organizations/' + item.id}>
                          {item.name}
                        </Link>
                        <small>Mã đăng ký: {item.registrationNumber}</small>
                      </td>
                      <td>{item.ownerEmail}</td>
                      <td>
                        <Status value={item.reviewStatus} />
                      </td>
                      <td>
                        <Link className="text-link" to={'/admin/organizations/' + item.id}>
                          Xem hồ sơ <span aria-hidden="true">→</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              {total} hồ sơ · Trang {page} / {totalPages || 1}
            </div>
          </>
        )}
      </section>
      <div className="review-actions">
        <button disabled={loading || page === 1} onClick={() => setPage(page - 1)}>
          Trước
        </button>
        <button disabled={loading || page >= totalPages} onClick={() => setPage(page + 1)}>
          Sau
        </button>
      </div>
      <aside className="info-strip">
        <span className="info-icon" aria-hidden="true">
          i
        </span>
        <p>
          <strong>Duyệt hồ sơ một lần.</strong> Hồ sơ chỉ có thể được duyệt hoặc từ chối khi đang
          chờ duyệt. Người nộp nhận quyền Owner; hồ sơ nộp thay dùng lời mời qua email.
        </p>
      </aside>
    </>
  );
}
