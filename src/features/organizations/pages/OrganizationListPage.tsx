import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorNotice, Loading } from '../../../shared/ui';
import { Status, statusLabels } from '../components/OrganizationStatus';
import { useOrganizations } from '../hooks/useOrganizations';
export function OrganizationList() {
  const { items, loading, error, reload } = useOrganizations();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const normalized = query.trim().toLocaleLowerCase('vi');
  const filtered = items.filter(
    (item) =>
      (status === 'all' || item.reviewStatus === status) &&
      [item.name, item.registrationNumber, item.ownerEmail].some((value) =>
        value.toLocaleLowerCase('vi').includes(normalized),
      ),
  );
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
            <p>Hiển thị tối đa 200 hồ sơ do máy chủ trả về.</p>
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
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label>
            <span className="sr-only">Trạng thái hồ sơ</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
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
              {filtered.length} kết quả trong {items.length} hồ sơ đã tải · Bộ lọc chỉ áp dụng trên
              dữ liệu này.
            </div>
          </>
        )}
      </section>
      <aside className="info-strip">
        <span className="info-icon" aria-hidden="true">
          i
        </span>
        <p>
          <strong>Duyệt hồ sơ một lần.</strong> Hồ sơ chỉ có thể được duyệt hoặc từ chối khi đang
          chờ duyệt. Khi được duyệt, hệ thống gửi lời mời cho chủ sở hữu.
        </p>
      </aside>
    </>
  );
}
