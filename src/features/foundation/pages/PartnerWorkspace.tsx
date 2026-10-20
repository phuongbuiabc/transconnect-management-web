import { useCallback, useState } from 'react';
import { foundationApi } from '../api/foundationApi';
import { useFoundation } from '../hooks/useFoundation';
import { OrganizationWorkspace } from '../components/OrganizationWorkspace';
import { ErrorNotice, Loading } from '../../../shared/ui';
export function PartnerWorkspace() {
  const load = useCallback(
    async (signal: AbortSignal) => ({
      context: await foundationApi.context(signal),
      invitations: await foundationApi.invitations(undefined, signal),
    }),
    [],
  );
  const state = useFoundation(load);
  const [token, setToken] = useState('');
  return (
    <section>
      <h2>Không gian nhà xe</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void state.mutate(() => foundationApi.accept(token.trim(), false));
        }}
      >
        <label>
          Mã lời mời nhân viên / Owner từ email
          <input required value={token} onChange={(e) => setToken(e.target.value)} />
        </label>
        <button disabled={state.busy || !token.trim()}>Chấp nhận lời mời</button>
      </form>
      {state.error ? <ErrorNotice error={state.error} retry={state.reload} /> : null}
      {state.loading ? (
        <Loading />
      ) : (
        state.data?.context.memberships
          .filter((m) => m.isActive)
          .map((membership) => (
            <OrganizationWorkspace key={membership.organizationId} membership={membership} />
          ))
      )}
      <h3>Lời mời nhận được</h3>
      {state.data?.invitations.map((item) => (
        <p key={item.id}>
          {item.organizationName} · {item.role} ·{' '}
          {item.acceptedAt
            ? 'Đã nhận'
            : item.revokedAt
              ? 'Đã thu hồi'
              : new Date(item.expiresAt) < new Date()
                ? 'Hết hạn'
                : 'Chờ nhận'}{' '}
          · {new Date(item.expiresAt).toLocaleString('vi')}
        </p>
      ))}
      {state.data?.invitations.length === 0 ? <p>Chưa có lời mời qua email.</p> : null}
    </section>
  );
}
