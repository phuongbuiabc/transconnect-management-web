import { useCallback, useState } from 'react';
import { foundationApi } from '../api/foundationApi';
import { useFoundation } from '../hooks/useFoundation';
import { ReviewHistory } from '../components/ReviewHistory';
import { ErrorNotice, Loading } from '../../../shared/ui';
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
    <section className="foundation-workspace">
      <h1>Hồ sơ tài xế</h1>
      <label>
        Tìm theo tên
        <input
          value={search}
          maxLength={200}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </label>
      <label>
        Trạng thái
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tất cả</option>
          <option value="Pending">Chờ duyệt</option>
          <option value="Approved">Đã duyệt</option>
          <option value="Rejected">Từ chối</option>
        </select>
      </label>
      <label>
        Căn cứ xét duyệt
        <textarea value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} />
      </label>
      {state.error ? <ErrorNotice error={state.error} retry={state.reload} /> : null}
      {state.loading ? (
        <Loading />
      ) : (
        state.data?.items.map((driver) => (
          <article className="panel" key={driver.id}>
            <h2>{driver.fullName}</h2>
            <p>
              {driver.reviewStatus} · {driver.contactPhone || 'Chưa có số liên hệ'}
            </p>
            <p>
              {driver.contactAddress || 'Chưa có địa chỉ'} · {driver.reviewNote}
            </p>
            {driver.reviewStatus === 'Pending' ? (
              <div className="review-actions">
                <button
                  className="button primary"
                  disabled={state.busy || !note.trim()}
                  onClick={() =>
                    void state.mutate(() => foundationApi.reviewDriver(driver.id, true, note))
                  }
                >
                  Duyệt
                </button>
                <button
                  className="button danger-outline"
                  disabled={state.busy || !note.trim()}
                  onClick={() =>
                    void state.mutate(() => foundationApi.reviewDriver(driver.id, false, note))
                  }
                >
                  Từ chối
                </button>
              </div>
            ) : null}
            <button
              className="button secondary"
              onClick={() => setSelected(selected === driver.id ? undefined : driver.id)}
            >
              Lịch sử xét duyệt
            </button>
            {selected === driver.id ? (
              <ReviewHistory key={driver.reviewStatus} type="drivers" id={driver.id} />
            ) : null}
          </article>
        ))
      )}
      {state.data?.totalRecords === 0 ? <p>Không có hồ sơ phù hợp.</p> : null}
      <button disabled={state.loading || page === 1} onClick={() => setPage(page - 1)}>
        Trước
      </button>{' '}
      Trang {page} / {state.data?.totalPages || 1}
      <button
        disabled={state.loading || page >= (state.data?.totalPages || 1)}
        onClick={() => setPage(page + 1)}
      >
        Sau
      </button>
    </section>
  );
}
