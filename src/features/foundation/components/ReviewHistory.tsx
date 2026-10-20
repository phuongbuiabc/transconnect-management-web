import { useCallback } from 'react';
import { foundationApi } from '../api/foundationApi';
import { useFoundation } from '../hooks/useFoundation';
import { ErrorNotice, Loading } from '../../../shared/ui';
export function ReviewHistory({ type, id }: { type: 'drivers' | 'organizations'; id: string }) {
  const load = useCallback(
    (signal: AbortSignal) => foundationApi.history(type, id, signal),
    [type, id],
  );
  const state = useFoundation(load);
  return (
    <section className="panel">
      <h2>Lịch sử xét duyệt</h2>
      {state.loading ? (
        <Loading />
      ) : state.error ? (
        <ErrorNotice error={state.error} retry={state.reload} />
      ) : state.data?.length ? (
        state.data.map((review) => (
          <p key={review.id}>
            {new Date(review.createdAt).toLocaleString('vi')} · {review.status} · {review.note}
          </p>
        ))
      ) : (
        <p>Chưa có lần xét duyệt được ghi nhận.</p>
      )}
    </section>
  );
}
