import { useCallback, useState } from 'react';
import { locationsApi } from '../api/locationsApi';
import { useLocations } from '../hooks/useLocations';
import { LocationForm } from '../components/LocationForm';
import { LocationMap } from '../components/LocationMap';
import type { SharedLocation } from '../models/location';
import { ErrorNotice, Loading } from '../../../shared/ui';
import { Icon } from '../../../shared/ui/Icon';
import { useAuth } from '../../auth/hooks/useAuth';
import '../locations.css';
export function LocationsPage({ organizationId }: { organizationId?: string }) {
  const auth = useAuth();
  if (!organizationId && !auth.user?.permissions.includes('locations.manage'))
    return <p>Bạn cần quyền quản lý địa điểm.</p>;
  return (
    <LocationsContent
      key={organizationId ?? auth.user?.accountId}
      organizationId={organizationId}
    />
  );
}
function LocationsContent({ organizationId }: { organizationId?: string }) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'shared' | 'requests'>('shared');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<SharedLocation | null | undefined>();
  const [reason, setReason] = useState('');
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const state = useLocations(
    useCallback(
      async (signal) => ({
        shared: await locationsApi.shared(query, page, signal, !organizationId),
        requests: await locationsApi.requests(organizationId, signal),
      }),
      [query, page, organizationId],
    ),
  );
  return (
    <section className="locations-page">
      <header className="locations-heading">
        <div>
          <h1>{organizationId ? 'Đề xuất địa điểm vận tải' : 'Quản lý địa điểm'}</h1>
          <p>Quản lý bến xe, điểm đón trả và điểm phục vụ trên bản đồ.</p>
        </div>
        <button
          className="button primary"
          disabled={state.busy}
          onClick={() => {
            setSuccess('');
            setEditing(null);
          }}
        >
          <Icon name="plus" /> Thêm địa điểm
        </button>
      </header>
      {success ? (
        <p className="locations-success" role="status">
          {success}
        </p>
      ) : null}
      {state.error ? <ErrorNotice error={state.error} retry={state.reload} /> : null}
      {historyId ? (
        <LocationHistory key={historyId} id={historyId} onClose={() => setHistoryId(null)} />
      ) : null}
      {editing !== undefined ? (
        <LocationForm
          key={editing?.id ?? 'new'}
          initial={editing}
          busy={state.busy}
          onCancel={() => setEditing(undefined)}
          onSave={(value) => {
            void state
              .mutate(() => locationsApi.save(value, editing, organizationId))
              .then((ok) => {
                if (ok) {
                  setEditing(undefined);
                  setSuccess(
                    organizationId ? 'Đã gửi đề xuất để xét duyệt.' : 'Đã lưu địa điểm thành công.',
                  );
                }
              });
          }}
        />
      ) : null}
      <div className="locations-panel">
        <div className="locations-tabs" aria-label="Nhóm địa điểm">
          <button
            className={tab === 'shared' ? 'is-selected' : ''}
            aria-pressed={tab === 'shared'}
            onClick={() => setTab('shared')}
          >
            Danh mục địa điểm
          </button>
          <button
            className={tab === 'requests' ? 'is-selected' : ''}
            aria-pressed={tab === 'requests'}
            onClick={() => setTab('requests')}
          >
            Đề xuất & xét duyệt
          </button>
        </div>
        {tab === 'shared' ? (
          <form
            className="locations-search"
            onSubmit={(event) => {
              event.preventDefault();
              setQuery(search.trim());
              setPage(1);
            }}
          >
            <label htmlFor="location-search">
              Tìm địa điểm
              <input
                id="location-search"
                placeholder="Nhập tên hoặc địa chỉ…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <button className="button secondary" disabled={state.busy}>
              Tìm kiếm
            </button>
            {query ? (
              <button
                className="button secondary"
                type="button"
                onClick={() => {
                  setSearch('');
                  setQuery('');
                  setPage(1);
                }}
              >
                Xóa bộ lọc
              </button>
            ) : null}
          </form>
        ) : null}
        {(tab === 'shared' && state.data?.shared.items.some((item) => item.isActive)) ||
        (tab === 'requests' &&
          !organizationId &&
          state.data?.requests.some((item) => item.status === 'Pending')) ? (
          <label className="locations-reason">
            Lý do duyệt / từ chối / ngừng dùng
            <input value={reason} maxLength={1000} onChange={(e) => setReason(e.target.value)} />
          </label>
        ) : null}
        {state.loading ? (
          <Loading />
        ) : state.error && !state.data ? (
          <p className="locations-empty">
            Chưa tải được dữ liệu. Vui lòng thử lại bằng nút ở thông báo lỗi.
          </p>
        ) : (
          <>
            {tab === 'shared' ? (
              <>
                <h3>{organizationId ? 'Điểm đang sử dụng' : 'Danh mục điểm và lịch sử'}</h3>
                {state.data?.shared.items.length === 0 ? (
                  <div className="locations-empty">
                    <span>
                      <Icon name="locations" />
                    </span>
                    <h3>{query ? 'Không tìm thấy địa điểm' : 'Chưa có địa điểm phục vụ'}</h3>
                    <p>
                      {query
                        ? 'Thử tên khác hoặc xóa bộ lọc tìm kiếm.'
                        : 'Danh mục tỉnh/phường không tự tạo bến xe hay điểm đón trả. Hãy thêm địa điểm đầu tiên để bắt đầu.'}
                    </p>
                    <button className="button primary" onClick={() => setEditing(null)}>
                      <Icon name="plus" /> Thêm địa điểm
                    </button>
                  </div>
                ) : null}
                {state.data?.shared.items.map((item) => (
                  <article className="locations-card" key={item.id}>
                    <div className="location-record-main">
                      <span className="location-pin">
                        <Icon name="locations" />
                      </span>
                      <div>
                        <h4>{item.name}</h4>
                        <p>
                          {item.addressDetail} · {item.latitude}, {item.longitude}
                        </p>
                        <p>{item.accessInstructions}</p>
                        <p>
                          Phiên bản {item.version} ·{' '}
                          {item.isActive ? 'Đang sử dụng' : 'Đã ngừng dùng'}
                        </p>
                      </div>
                    </div>
                    <div className="location-record-actions">
                      {!organizationId ? (
                        <button onClick={() => setHistoryId(item.id)}>Lịch sử</button>
                      ) : null}
                      <button
                        disabled={state.busy || !item.isActive}
                        onClick={() => setEditing(item)}
                      >
                        Xem ghim / sửa cùng điểm
                      </button>
                      <button
                        disabled={state.busy || !item.isActive || !reason.trim()}
                        onClick={() => {
                          void state.mutate(() =>
                            locationsApi.archive(item, reason, organizationId),
                          );
                        }}
                      >
                        {organizationId ? 'Đề xuất ngừng dùng' : 'Ngừng dùng'}
                      </button>
                    </div>
                  </article>
                ))}
                <div className="locations-pagination">
                  <button disabled={page === 1 || state.busy} onClick={() => setPage(page - 1)}>
                    Trước
                  </button>{' '}
                  Trang {page}{' '}
                  <button
                    disabled={!state.data || page >= state.data.shared.totalPages || state.busy}
                    onClick={() => setPage(page + 1)}
                  >
                    Sau
                  </button>
                  <span>{state.data?.shared.totalRecords ?? 0} địa điểm</span>
                </div>
              </>
            ) : (
              <>
                <h3>{organizationId ? 'Đề xuất của tổ chức' : 'Đề xuất và kết quả xét duyệt'}</h3>
                {state.data?.requests.length === 0 ? (
                  <div className="locations-empty">
                    <span>
                      <Icon name="document" />
                    </span>
                    <h3>Chưa có đề xuất</h3>
                    <p>Các yêu cầu tạo, sửa hoặc ngừng dùng địa điểm sẽ xuất hiện tại đây.</p>
                  </div>
                ) : null}
                {state.data?.requests.map((item) => (
                  <article className="locations-card" key={item.id}>
                    <h4>{item.name ?? item.locationId}</h4>
                    <p>
                      {item.kind} · {item.status}
                    </p>
                    <p>
                      {item.addressDetail} · {item.latitude}, {item.longitude}
                    </p>
                    <p>{item.reason}</p>
                    <p>{item.reviewReason}</p>
                    <p>
                      Tỉnh: {item.provinceCode} · Xã/phường: {item.wardCode}
                    </p>
                    <p>{item.accessInstructions}</p>
                    {item.latitude != null && item.longitude != null ? (
                      <>
                        <button
                          onClick={() => setPreviewId(previewId === item.id ? null : item.id)}
                        >
                          Xem ghim đề xuất
                        </button>
                        {previewId === item.id ? (
                          <LocationMap
                            latitude={item.latitude}
                            longitude={item.longitude}
                            onPick={() => {}}
                          />
                        ) : null}
                      </>
                    ) : null}
                    {!organizationId && item.status === 'Pending' ? (
                      <>
                        <button
                          disabled={state.busy || !reason.trim()}
                          onClick={() => {
                            void state.mutate(() => locationsApi.review(item, true, reason));
                          }}
                        >
                          Duyệt
                        </button>
                        <button
                          disabled={state.busy || !reason.trim()}
                          onClick={() => {
                            void state.mutate(() => locationsApi.review(item, false, reason));
                          }}
                        >
                          Từ chối
                        </button>
                      </>
                    ) : null}
                  </article>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function LocationHistory({ id, onClose }: { id: string; onClose: () => void }) {
  const state = useLocations(useCallback((signal) => locationsApi.history(id, signal), [id]));
  return (
    <aside className="locations-card">
      <h3>Lịch sử điểm phục vụ</h3>
      <button onClick={onClose}>Đóng lịch sử</button>
      {state.loading ? <Loading /> : null}
      {state.error ? <ErrorNotice error={state.error} retry={state.reload} /> : null}
      {state.data?.map((item) => (
        <article key={item.version}>
          <h4>
            Phiên bản {item.version}: {item.name}
          </h4>
          <p>
            {item.addressDetail} · {item.latitude}, {item.longitude}
          </p>
          <p>
            {item.isActive ? 'Đang sử dụng tại thời điểm ghi' : 'Ngừng dùng'} · {item.reason} ·{' '}
            {item.changedAt}
          </p>
        </article>
      ))}
    </aside>
  );
}
