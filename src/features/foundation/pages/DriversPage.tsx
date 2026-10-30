import { Fragment, useCallback, useState } from 'react';
import { foundationApi } from '../api/foundationApi';
import { useFoundation } from '../hooks/useFoundation';
import { ReviewHistory } from '../components/ReviewHistory';
import { ErrorNotice, Loading } from '../../../shared/ui';
import { Icon } from '../../../shared/ui/Icon';
import { EmptyRecords, EntityName, PageHeader, Pagination } from '../../../shared/ui/RecordLayout';
import { Status } from '../../organizations/components/OrganizationStatus';
export function DriversPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('Pending');
  const [search, setSearch] = useState('');
  const [note, setNote] = useState('');
  const [selected, setSelected] = useState<string>();
  const load = useCallback(
    (signal: AbortSignal) => foundationApi.drivers(page, status, search, signal),
    [page, status, search],
  );
  const state = useFoundation(load);
  return (
    <section className="records-page">
      <PageHeader
        title="Hồ sơ tài xế"
        description="Xem xét hồ sơ đăng ký, thông tin liên hệ và lịch sử xét duyệt."
        action={
          <button
            type="button"
            className="button secondary"
            disabled={state.loading || state.busy}
            onClick={state.reload}
          >
            <Icon name="refresh" />
            Làm mới
          </button>
        }
      />
      <section className="panel" aria-label="Danh sách hồ sơ tài xế" aria-busy={state.loading}>
        <div className="panel-toolbar">
          <div>
            <h2>Danh sách tài xế</h2>
            <p>Kiểm tra thông tin và nhập căn cứ trước khi xét duyệt.</p>
          </div>
        </div>
        <div className="filters">
          <label className="search-label">
            <span className="filter-caption">Tìm kiếm tài xế</span>
            <span className="search-control">
              <Icon name="search" />
              <input
                type="search"
                placeholder="Tìm theo họ tên…"
                maxLength={200}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </span>
          </label>
          <label>
            <span className="filter-caption">Trạng thái hồ sơ</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Pending">Chờ duyệt</option>
              <option value="Approved">Đã duyệt</option>
              <option value="Rejected">Từ chối</option>
            </select>
          </label>
        </div>
        <label className="review-note-field">
          Căn cứ xét duyệt
          <textarea
            rows={2}
            value={note}
            maxLength={2000}
            placeholder="Nhập nhận xét hoặc căn cứ để duyệt / từ chối hồ sơ"
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        {state.error ? <ErrorNotice error={state.error} retry={state.reload} /> : null}
        {state.loading ? (
          <Loading />
        ) : state.data?.items.length ? (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Bảng tài xế, có thể cuộn ngang"
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">Tài xế</th>
                  <th scope="col">Liên hệ</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {state.data.items.map((driver) => (
                  <Fragment key={driver.id}>
                    <tr>
                      <td>
                        <EntityName
                          name={driver.fullName}
                          secondary={driver.contactAddress || 'Chưa có địa chỉ'}
                        />
                        {driver.reviewNote ? <small>{driver.reviewNote}</small> : null}
                      </td>
                      <td>{driver.contactPhone || 'Chưa có số liên hệ'}</td>
                      <td>
                        {driver.reviewStatus === 'Pending' ||
                        driver.reviewStatus === 'Approved' ||
                        driver.reviewStatus === 'Rejected' ? (
                          <Status value={driver.reviewStatus} />
                        ) : (
                          <span className="status">{driver.reviewStatus}</span>
                        )}
                      </td>
                      <td>
                        <div className="record-actions">
                          <button
                            type="button"
                            className="text-link"
                            aria-expanded={selected === driver.id}
                            onClick={() =>
                              setSelected(selected === driver.id ? undefined : driver.id)
                            }
                          >
                            Lịch sử
                            <Icon name="right" />
                          </button>
                          {driver.reviewStatus === 'Pending' ? (
                            <>
                              <button
                                type="button"
                                className="button primary"
                                disabled={state.busy || !note.trim()}
                                onClick={() =>
                                  void state.mutate(() =>
                                    foundationApi.reviewDriver(driver.id, true, note),
                                  )
                                }
                              >
                                Duyệt
                              </button>
                              <button
                                type="button"
                                className="button danger-outline"
                                disabled={state.busy || !note.trim()}
                                onClick={() =>
                                  void state.mutate(() =>
                                    foundationApi.reviewDriver(driver.id, false, note),
                                  )
                                }
                              >
                                Từ chối
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    {selected === driver.id ? (
                      <tr>
                        <td colSpan={4} className="record-expanded">
                          <ReviewHistory key={driver.reviewStatus} type="drivers" id={driver.id} />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : !state.error ? (
          <EmptyRecords title="Không có hồ sơ tài xế phù hợp" />
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
