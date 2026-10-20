import { useCallback } from 'react';
import { foundationApi } from '../api/foundationApi';
import { useFoundation } from '../hooks/useFoundation';
import { ErrorNotice, Loading } from '../../../shared/ui';
export function EngagementContact({
  organizationId,
  engagementId,
}: {
  organizationId: string;
  engagementId: string;
}) {
  const load = useCallback(
    (signal: AbortSignal) => foundationApi.engagementContact(organizationId, engagementId, signal),
    [organizationId, engagementId],
  );
  const state = useFoundation(load);
  if (state.loading) return <Loading />;
  if (state.error) return <ErrorNotice error={state.error} retry={state.reload} />;
  const data = state.data;
  return (
    <section>
      <h4>{data?.isHistorical ? 'Liên hệ tại thời điểm kết thúc' : 'Liên hệ hiện tại'}</h4>
      {data?.isHistorical && !data.snapshotAvailable ? (
        <p>Không có snapshot lịch sử cho quan hệ cũ.</p>
      ) : (
        <p>
          {data?.fullName} · {data?.contactPhone || 'Chưa có số liên hệ'} ·{' '}
          {data?.contactAddress || 'Chưa có địa chỉ'}
        </p>
      )}
    </section>
  );
}
