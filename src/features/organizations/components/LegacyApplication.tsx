import { useState } from 'react';
import type { Organization } from '../models/organization';
import { useApplication } from '../hooks/useApplication';
import { ErrorNotice } from '../../../shared/ui';
export function LegacyApplication({
  organization,
  reload,
}: {
  organization: Organization;
  reload: () => void;
}) {
  const state = useApplication(reload);
  const [name, setName] = useState(organization.name);
  const [number, setNumber] = useState(organization.registrationNumber);
  const [email, setEmail] = useState(organization.ownerEmail);
  return (
    <section className="panel">
      <h2>Hồ sơ nộp thay / hồ sơ cũ</h2>
      {organization.reviewStatus === 'Rejected' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void state.submit(name, number, organization.id, email);
          }}
        >
          <label>
            Tên tổ chức
            <input
              required
              maxLength={200}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Mã số thuế
            <input
              required
              pattern="[0-9]{10}([0-9]{3})?"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </label>
          <label>
            Email nhận Owner
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button className="button primary" disabled={state.busy}>
            Sửa và nộp lại
          </button>
        </form>
      ) : null}
      {organization.reviewStatus === 'Approved' ? (
        <button
          className="button secondary"
          disabled={state.busy}
          onClick={() => void state.reinvite(organization.id)}
        >
          Gửi lại lời mời Owner
        </button>
      ) : null}
      {state.error ? <ErrorNotice error={state.error} /> : null}
      {state.notice ? <p role="status">{state.notice}</p> : null}
    </section>
  );
}
