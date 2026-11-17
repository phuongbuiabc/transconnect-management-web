import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ErrorNotice, Loading } from '../../../shared/ui';
import { Icon } from '../../../shared/ui/Icon';
import { EmptyRecords, EntityName, PageHeader, Pagination } from '../../../shared/ui/RecordLayout';
import { transportApi } from '../api/transportApi';
import { TransportStatus } from '../components/TransportStatus';
import { useAdminRegistration, useAdminRegistrations } from '../hooks/useTransport';
import { registrationStatusLabels, serviceTypeOptions } from '../models/transport';
import '../transport.css';

/** Admin: hàng đợi đăng ký dịch vụ, xét duyệt thủ công từng loại dịch vụ của từng tổ chức. */
export function AdminServicesPage() {
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('search') ?? '');
  const [status, setStatus] = useState(params.get('search') ? '' : 'Pending');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const state = useAdminRegistrations(page, status, type, query.trim());
  const items = state.data?.items ?? [];
  return (
    <>
      <PageHeader
        title="Đăng ký dịch vụ"
        description="Xét duyệt loại dịch vụ mỗi đơn vị vận tải được phép khai thác."
        action={
          <button
            type="button"
            className="button secondary"
            disabled={state.loading}
            onClick={state.reload}
          >
            <Icon name="refresh" />
            Làm mới
          </button>
        }
      />
      <section className="panel" aria-label="Danh sách đăng ký dịch vụ" aria-busy={state.loading}>
        <div className="filters">
          <label className="search-label">
            <span className="filter-caption">Tìm đơn vị</span>
            <span className="search-control">
              <Icon name="search" />
              <input
                type="search"
                maxLength={100}
                placeholder="Tên đơn vị hoặc mã số thuế…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </span>
          </label>
          <label>
            <span className="filter-caption">Trạng thái</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(registrationStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="filter-caption">Loại dịch vụ</span>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả loại</option>
              {serviceTypeOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {state.loading ? (
          <Loading />
        ) : state.error ? (
          <ErrorNotice error={state.error} retry={state.reload} />
        ) : items.length === 0 ? (
          <EmptyRecords
            title="Không có đăng ký phù hợp"
            description="Đăng ký dịch vụ được tạo khi tổ chức được duyệt hoặc khi Owner đăng ký thêm."
          />
        ) : (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Bảng đăng ký dịch vụ, có thể cuộn ngang"
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">Đơn vị vận tải</th>
                  <th scope="col">Loại dịch vụ</th>
                  <th scope="col">Ngày nộp</th>
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
                        name={item.organizationName ?? 'Không rõ'}
                        secondary={'MST: ' + (item.registrationNumber ?? '—')}
                      />
                    </td>
                    <td>{item.serviceTypeName}</td>
                    <td>{new Date(item.submittedAt).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <TransportStatus value={item.status} />
                    </td>
                    <td>
                      <Link className="text-link" to={'/admin/services/' + item.id}>
                        {item.status === 'Pending' ? 'Xét duyệt' : 'Xem'}
                        <Icon name="arrow" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <Pagination
        page={page}
        totalPages={state.data?.totalPages ?? 1}
        total={state.data?.totalRecords ?? 0}
        loading={state.loading}
        onChange={setPage}
      />
      <aside className="info-strip">
        <Icon name="info" />
        <p>
          <strong>Xét duyệt thủ công.</strong> Tổ chức phải được duyệt trước. Duyệt xe khách cho
          phép nhà xe tự công bố tuyến; quản trị viên ngừng tuyến hoặc tạm ngưng dịch vụ khi vi
          phạm.
        </p>
      </aside>
    </>
  );
}

type Action = 'Approved' | 'Rejected' | 'suspend' | 'reinstate';
const actionLabels: Record<Action, string> = {
  Approved: 'Duyệt dịch vụ',
  Rejected: 'Từ chối',
  suspend: 'Tạm ngưng dịch vụ',
  reinstate: 'Khôi phục dịch vụ',
};

export function AdminServiceDetailPage() {
  const { id = '' } = useParams();
  const state = useAdminRegistration(id);
  const [action, setAction] = useState<Action | null>(null);
  const [note, setNote] = useState('');
  const [routeNote, setRouteNote] = useState('');
  const [routeTarget, setRouteTarget] = useState<string | null>(null);
  const item = state.data?.registration;
  const noteRequired = action === 'Rejected' || action === 'suspend';
  async function confirm() {
    if (!item || !action) return;
    const ok = await state.mutate(() =>
      action === 'suspend'
        ? transportApi.suspend(item, note.trim())
        : action === 'reinstate'
          ? transportApi.reinstate(item, note.trim())
          : transportApi.review(item, action, note.trim()),
    );
    if (ok) {
      setAction(null);
      setNote('');
    }
  }
  return (
    <>
      <Link className="back-link" to="/admin/services">
        <Icon name="left" /> Danh sách đăng ký dịch vụ
      </Link>
      {state.loading ? (
        <Loading />
      ) : !item ? (
        <ErrorNotice error={state.error} retry={state.reload} />
      ) : (
        <>
          <div className="page-heading">
            <div>
              <h1>{item.serviceTypeName}</h1>
              <p className="reference">
                {item.organizationName} · MST {item.registrationNumber}
              </p>
            </div>
            <TransportStatus value={item.status} />
          </div>
          {state.error ? <ErrorNotice error={state.error} /> : null}
          <div className="detail-grid">
            <section className="panel detail-panel">
              <h2>Thông tin đăng ký</h2>
              <dl>
                <div>
                  <dt>Đơn vị vận tải</dt>
                  <dd>
                    <Link to={'/admin/organizations/' + item.organizationId}>
                      {item.organizationName}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt>Phạm vi khai báo</dt>
                  <dd>{item.scopeNote || 'Không khai báo'}</dd>
                </div>
                <div>
                  <dt>Ngày nộp</dt>
                  <dd>{new Date(item.submittedAt).toLocaleString('vi-VN')}</dd>
                </div>
                <div>
                  <dt>Ghi chú xét duyệt</dt>
                  <dd>{item.reviewNote || '—'}</dd>
                </div>
              </dl>
            </section>
            <section className="panel detail-panel review-panel">
              <h2>Quyết định</h2>
              {!action ? (
                <div className="review-actions">
                  {item.status === 'Pending' ? (
                    <>
                      <button className="button primary" onClick={() => setAction('Approved')}>
                        Duyệt dịch vụ
                      </button>
                      <button
                        className="button danger-outline"
                        onClick={() => setAction('Rejected')}
                      >
                        Từ chối
                      </button>
                    </>
                  ) : item.status === 'Approved' ? (
                    <button className="button danger-outline" onClick={() => setAction('suspend')}>
                      Tạm ngưng dịch vụ
                    </button>
                  ) : item.status === 'Suspended' ? (
                    <button className="button primary" onClick={() => setAction('reinstate')}>
                      Khôi phục dịch vụ
                    </button>
                  ) : (
                    <p className="field-hint">Đăng ký không còn thao tác xét duyệt.</p>
                  )}
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void confirm();
                  }}
                >
                  <div className="decision-label">{actionLabels[action]}</div>
                  <label htmlFor="service-note">
                    Ghi chú {noteRequired ? <span aria-hidden="true">*</span> : '(không bắt buộc)'}
                  </label>
                  <textarea
                    id="service-note"
                    autoFocus
                    rows={4}
                    maxLength={2000}
                    required={noteRequired}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  {action === 'suspend' ? (
                    <p className="field-hint">
                      Tạm ngưng sẽ tạm dừng mọi lịch chạy đang hoạt động của dịch vụ này.
                    </p>
                  ) : null}
                  <div className="review-actions">
                    <button
                      className={
                        'button ' +
                        (action === 'Rejected' || action === 'suspend' ? 'danger' : 'primary')
                      }
                      disabled={state.busy || (noteRequired && !note.trim())}
                    >
                      {state.busy ? 'Đang lưu…' : 'Xác nhận'}
                    </button>
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => setAction(null)}
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              )}
            </section>
            {item.events?.length ? (
              <section className="panel detail-history">
                <h2>Lịch sử</h2>
                <ol className="transport-history">
                  {item.events.map((event) => (
                    <li key={event.id}>
                      {new Date(event.createdAt).toLocaleString('vi-VN')} · {event.action} ·{' '}
                      <TransportStatus value={event.status} />
                      {event.note ? ' · ' + event.note : ''}
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
            {state.data?.routes.length ? (
              <section className="panel detail-history">
                <h2>Tuyến của đơn vị</h2>
                <div className="table-scroll" tabIndex={0} role="region" aria-label="Tuyến">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Tuyến</th>
                        <th scope="col">Hành trình</th>
                        <th scope="col">Trạng thái</th>
                        <th scope="col">
                          <span className="sr-only">Thao tác</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.data.routes.map((route) => (
                        <tr key={route.id}>
                          <td>
                            <strong>{route.code}</strong> · {route.name}
                          </td>
                          <td>
                            {route.firstStopName
                              ? route.firstStopName + ' → ' + route.lastStopName
                              : 'Chưa công bố'}
                          </td>
                          <td>
                            <TransportStatus value={route.status} />
                            {route.statusReason ? <small> {route.statusReason}</small> : null}
                          </td>
                          <td>
                            {route.status === 'Active' && routeTarget !== route.id ? (
                              <button
                                type="button"
                                className="button danger-outline"
                                onClick={() => {
                                  setRouteTarget(route.id);
                                  setRouteNote('');
                                }}
                              >
                                Ngừng tuyến
                              </button>
                            ) : null}
                            {routeTarget === route.id ? (
                              <form
                                className="inline-form"
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  void state
                                    .mutate(() =>
                                      transportApi.adminDeactivateRoute(route, routeNote.trim()),
                                    )
                                    .then((ok) => ok && setRouteTarget(null));
                                }}
                              >
                                <input
                                  required
                                  maxLength={1000}
                                  placeholder="Lý do vi phạm"
                                  aria-label="Lý do ngừng tuyến"
                                  value={routeNote}
                                  onChange={(e) => setRouteNote(e.target.value)}
                                />
                                <button
                                  className="button danger"
                                  disabled={state.busy || !routeNote.trim()}
                                >
                                  Xác nhận
                                </button>
                                <button
                                  type="button"
                                  className="button secondary"
                                  onClick={() => setRouteTarget(null)}
                                >
                                  Hủy
                                </button>
                              </form>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}
          </div>
        </>
      )}
    </>
  );
}
