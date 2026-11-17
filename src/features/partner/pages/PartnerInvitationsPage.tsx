import { useState } from 'react';
import { ErrorNotice, Loading } from '../../../shared/ui';
import { EmptyRecords, PageHeader } from '../../../shared/ui/RecordLayout';
import { foundationApi } from '../../foundation/api/foundationApi';
import { usePartner } from '../hooks/usePartner';
import { invitationState, isOpenInvitation, roleLabel } from '../models/partnerStage';

/** Received invitations; membership invitations are accepted in place, driver ones in the Driver app. */
export function PartnerInvitationsPage() {
  const partner = usePartner();
  const [token, setToken] = useState('');
  const hasMembership = partner.membership !== null;
  return (
    <section className="partner-flow">
      <PageHeader
        title="Lời mời nhận được"
        description="Lời mời gửi tới email tài khoản này. Nhận lời mời Owner hoặc nhân viên ngay tại đây."
      />
      {partner.error ? <ErrorNotice error={partner.error} retry={partner.reload} /> : null}
      {hasMembership ? (
        <p className="notice">
          Tài khoản đã thuộc {partner.membership?.organizationName}. Mỗi tài khoản chỉ có một tư
          cách thành viên nên không nhận thêm lời mời tổ chức.
        </p>
      ) : null}
      {partner.loading ? (
        <Loading />
      ) : partner.invitations.length ? (
        <div className="partner-list">
          {partner.invitations.map((item) => {
            const open = isOpenInvitation(item);
            const driver = item.role === 'Driver';
            return (
              <article className="panel partner-record" key={item.id}>
                <div className="partner-stage-title">
                  <h2>{item.organizationName}</h2>
                  <span className={'status ' + (open ? 'status-pending' : 'status-neutral')}>
                    <span aria-hidden="true" />
                    {invitationState(item)}
                  </span>
                </div>
                <p className="partner-meta">
                  {roleLabel(item.role)} · hết hạn {new Date(item.expiresAt).toLocaleString('vi')}
                </p>
                {open && driver ? (
                  <p>Lời mời tài xế được nhận trong app VieGo Driver bằng tài khoản tài xế.</p>
                ) : null}
                {open && !driver && !hasMembership ? (
                  <button
                    type="button"
                    className="button primary"
                    disabled={partner.busy}
                    onClick={() =>
                      void partner.mutate(() => foundationApi.acceptMembership(item.id))
                    }
                  >
                    {partner.busy ? 'Đang nhận…' : 'Nhận lời mời'}
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyRecords
          title="Chưa có lời mời"
          description="Khi tổ chức mời email của bạn, lời mời sẽ hiện ở đây."
        />
      )}
      {!hasMembership ? (
        <details className="panel partner-form">
          <summary>Nhận bằng mã trong email</summary>
          <p>Mã chỉ dùng được với tài khoản có đúng email nhận lời mời.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void partner
                .mutate(() => foundationApi.accept(token.trim(), false))
                .then((ok) => ok && setToken(''));
            }}
          >
            <label>
              Mã lời mời
              <input required value={token} onChange={(e) => setToken(e.target.value)} />
            </label>
            <button className="button secondary" disabled={partner.busy || !token.trim()}>
              Chấp nhận bằng mã
            </button>
          </form>
        </details>
      ) : null}
    </section>
  );
}
