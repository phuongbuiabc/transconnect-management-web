import { useCallback, useState } from 'react';
import { foundationApi } from '../api/foundationApi';
import { useFoundation } from '../hooks/useFoundation';
import { ErrorNotice, Loading } from '../../../shared/ui';
export function AdminVehicleLink({ id }: { id: string }) {
  const load = useCallback((signal: AbortSignal) => foundationApi.vehicles(id, signal), [id]);
  const state = useFoundation(load);
  const [plate, setPlate] = useState('');
  const [reference, setReference] = useState('');
  return (
    <section className="panel">
      <h2>Xác nhận liên kết phương tiện</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void state.mutate(() => foundationApi.linkVehicle(id, plate, reference));
        }}
      >
        <label>
          Biển số
          <input required value={plate} onChange={(e) => setPlate(e.target.value)} />
        </label>
        <label>
          Căn cứ xác minh quyền khai thác
          <input
            required
            maxLength={1000}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </label>
        <button disabled={state.busy}>Xác nhận và liên kết xe</button>
      </form>
      {state.error ? <ErrorNotice error={state.error} retry={state.reload} /> : null}
      {state.loading ? (
        <Loading />
      ) : (
        state.data?.map((vehicle) => (
          <p key={vehicle.linkId}>
            {vehicle.registrationPlate} · {vehicle.endedAt ? 'Đã kết thúc' : 'Đang liên kết'}
          </p>
        ))
      )}
    </section>
  );
}
