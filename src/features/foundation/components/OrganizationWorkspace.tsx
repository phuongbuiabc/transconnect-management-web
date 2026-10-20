import { useCallback, useState } from 'react';
import { foundationApi } from '../api/foundationApi';
import { useFoundation } from '../hooks/useFoundation';
import { ProfileDocuments } from './ProfileDocuments';
import { EngagementContact } from './EngagementContact';
import type { Membership, Vehicle } from '../models/foundation';
import { ErrorNotice, Loading } from '../../../shared/ui';
import type { Organization } from '../../organizations/models/organization';
export function OrganizationWorkspace({ membership }: { membership: Membership }) {
  const [tab, setTab] = useState('drivers');
  const owner = membership.role === 'OrganizationOwner';
  return (
    <section className="panel">
      <h2>
        {membership.organizationName} · {membership.role}
      </h2>
      <p>
        Nhân viên và lời mời còn hiệu lực: {membership.employeeOccupancy}/{membership.employeeLimit}{' '}
        · Tài xế và lời mời: {membership.driverOccupancy}/
        {membership.driverLimit ?? 'Không giới hạn'}
      </p>
      <nav aria-label="Quản lý tổ chức">
        <button onClick={() => setTab('drivers')}>Tài xế</button>
        <button onClick={() => setTab('vehicles')}>Phương tiện</button>
        {owner ? (
          <>
            <button onClick={() => setTab('members')}>Nhân viên / lời mời</button>
            <button onClick={() => setTab('profile')}>Thông tin tổ chức</button>
          </>
        ) : null}
      </nav>
      {tab === 'drivers' ? <Drivers id={membership.organizationId} role={membership.role} /> : null}
      {tab === 'vehicles' ? (
        <Vehicles id={membership.organizationId} role={membership.role} />
      ) : null}
      {tab === 'members' && owner ? <Members id={membership.organizationId} /> : null}
      {tab === 'profile' && owner ? <OrganizationProfile id={membership.organizationId} /> : null}
    </section>
  );
}
function Members({ id }: { id: string }) {
  const [page, setPage] = useState(1);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Dispatcher');
  const load = useCallback(
    async (signal: AbortSignal) => ({
      members: await foundationApi.members(id, page, signal),
      invitations: await foundationApi.invitations(id, signal),
    }),
    [id, page],
  );
  const state = useFoundation(load);
  return (
    <section>
      <h3>Nhân viên và lời mời đã gửi</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void state.mutate(() => foundationApi.invite(id, email, role));
        }}
      >
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Vai trò
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option>Manager</option>
            <option>Dispatcher</option>
          </select>
        </label>
        <button disabled={state.busy}>Gửi lời mời</button>
      </form>
      {state.error ? <ErrorNotice error={state.error} retry={state.reload} /> : null}
      {state.loading ? (
        <Loading />
      ) : (
        state.data?.members.items.map((member) => (
          <article key={member.id}>
            <p>
              {member.fullName} · {member.role} ·{' '}
              {member.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
            </p>
            {member.role !== 'OrganizationOwner' ? (
              <>
                <button
                  disabled={state.busy}
                  onClick={() =>
                    void state.mutate(() =>
                      foundationApi.updateMember(id, member, member.role, !member.isActive),
                    )
                  }
                >
                  {member.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                </button>
                <button
                  disabled={state.busy}
                  onClick={() =>
                    void state.mutate(() =>
                      foundationApi.updateMember(
                        id,
                        member,
                        member.role === 'Manager' ? 'Dispatcher' : 'Manager',
                        member.isActive,
                      ),
                    )
                  }
                >
                  Đổi sang {member.role === 'Manager' ? 'Dispatcher' : 'Manager'}
                </button>
              </>
            ) : null}
          </article>
        ))
      )}
      <button disabled={page === 1 || state.loading} onClick={() => setPage(page - 1)}>
        Trước
      </button>{' '}
      Trang {page}
      <button
        disabled={state.loading || page >= (state.data?.members.totalPages || 1)}
        onClick={() => setPage(page + 1)}
      >
        Sau
      </button>
      {state.data?.invitations.map((invitation) => (
        <p key={invitation.id}>
          {invitation.email} · {invitation.role} ·{' '}
          {new Date(invitation.expiresAt).toLocaleString('vi')} ·{' '}
          {invitation.acceptedAt ? 'Đã nhận' : invitation.revokedAt ? 'Đã thu hồi' : 'Chưa nhận'}
          {!invitation.acceptedAt && !invitation.revokedAt ? (
            <button
              disabled={state.busy}
              onClick={() => void state.mutate(() => foundationApi.revoke(id, invitation.id))}
            >
              Thu hồi
            </button>
          ) : null}
        </p>
      ))}
    </section>
  );
}
function Drivers({ id, role }: { id: string; role: string }) {
  const [page, setPage] = useState(1);
  const [email, setEmail] = useState('');
  const [selected, setSelected] = useState<string>();
  const load = useCallback(
    (signal: AbortSignal) => foundationApi.engagements(id, page, signal),
    [id, page],
  );
  const state = useFoundation(load);
  return (
    <section>
      <h3>Tài xế cộng tác</h3>
      {role !== 'Dispatcher' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void state.mutate(() => foundationApi.invite(id, email, 'Driver'));
          }}
        >
          <label>
            Email tài xế
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button disabled={state.busy}>Mời tài xế</button>
        </form>
      ) : null}
      {state.error ? <ErrorNotice error={state.error} retry={state.reload} /> : null}
      {state.loading ? (
        <Loading />
      ) : (
        state.data?.items.map((item) => (
          <article key={item.id}>
            <p>
              {item.fullName} ·{' '}
              {item.endedAt
                ? 'Đã kết thúc'
                : item.revokedAt
                  ? 'Đã thu hồi'
                  : item.acceptedAt
                    ? 'Đang cộng tác'
                    : 'Đang mời'}
            </p>
            {role !== 'Dispatcher' && !item.endedAt && !item.revokedAt ? (
              <button
                disabled={state.busy}
                onClick={() => void state.mutate(() => foundationApi.endEngagement(id, item.id))}
              >
                Kết thúc / thu hồi
              </button>
            ) : null}
            {role === 'OrganizationOwner' && item.acceptedAt && !item.revokedAt ? (
              <>
                <button onClick={() => setSelected(selected === item.id ? undefined : item.id)}>
                  Xem liên hệ / hồ sơ
                </button>
                {selected === item.id ? (
                  <>
                    <EngagementContact organizationId={id} engagementId={item.id} />
                    {!item.endedAt ? (
                      <ProfileDocuments type="Driver" id={item.driverId} readOnly />
                    ) : null}
                  </>
                ) : null}
              </>
            ) : null}
          </article>
        ))
      )}
      <button disabled={page === 1 || state.loading} onClick={() => setPage(page - 1)}>
        Trước
      </button>{' '}
      Trang {page}
      <button
        disabled={state.loading || page >= (state.data?.totalPages || 1)}
        onClick={() => setPage(page + 1)}
      >
        Sau
      </button>
    </section>
  );
}
function Vehicles({ id, role }: { id: string; role: string }) {
  const load = useCallback((signal: AbortSignal) => foundationApi.vehicles(id, signal), [id]);
  const state = useFoundation(load);
  return (
    <section>
      <h3>Phương tiện</h3>
      <p>Admin xác nhận quyền khai thác trước khi liên kết xe.</p>
      {state.error ? <ErrorNotice error={state.error} retry={state.reload} /> : null}
      {state.loading ? (
        <Loading />
      ) : (
        state.data?.map((vehicle) => (
          <VehicleCard
            key={vehicle.linkId}
            vehicle={vehicle}
            id={id}
            role={role}
            busy={state.busy}
            mutate={state.mutate}
          />
        ))
      )}
      {state.data?.length === 0 ? <p>Chưa có phương tiện.</p> : null}
    </section>
  );
}
function VehicleCard({
  vehicle,
  id,
  role,
  busy,
  mutate,
}: {
  vehicle: Vehicle;
  id: string;
  role: string;
  busy: boolean;
  mutate: (action: () => Promise<unknown>) => Promise<boolean>;
}) {
  const [kind, setKind] = useState(vehicle.vehicleKind || 'Passenger');
  const [capacity, setCapacity] = useState(vehicle.seatCount ?? vehicle.permittedPayloadKg ?? 1);
  const [reason, setReason] = useState('');
  const [documents, setDocuments] = useState(false);
  return (
    <article>
      <h4>{vehicle.registrationPlate}</h4>
      <p>
        {vehicle.endedAt ? 'Đã kết thúc' : vehicle.isSuspended ? 'Tạm ngừng' : 'Đang khai thác'}
      </p>
      {!vehicle.endedAt && role !== 'Dispatcher' ? (
        <>
          <button
            disabled={busy}
            onClick={() => void mutate(() => foundationApi.suspension(id, vehicle))}
          >
            {vehicle.isSuspended ? 'Tiếp tục khai thác' : 'Tạm ngừng'}
          </button>
          <label>
            Lý do gỡ xe
            <input maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          <button
            disabled={busy || !reason.trim()}
            onClick={() => void mutate(() => foundationApi.endVehicle(id, vehicle.linkId, reason))}
          >
            Kết thúc liên kết
          </button>
        </>
      ) : null}
      {!vehicle.endedAt && role === 'OrganizationOwner' ? (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void mutate(() => foundationApi.vehicleProfile(id, vehicle, kind, capacity));
            }}
          >
            <label>
              Loại xe
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="Passenger">Chở người</option>
                <option value="Freight">Chở hàng</option>
              </select>
            </label>
            <label>
              {kind === 'Passenger' ? 'Số chỗ gồm lái xe' : 'Tải hàng cho phép (kg)'}
              <input
                type="number"
                min="0.01"
                step={kind === 'Passenger' ? '1' : '0.01'}
                required
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
              />
            </label>
            <button disabled={busy}>Lưu thông số</button>
          </form>
          <button onClick={() => setDocuments(!documents)}>Giấy đăng ký xe demo</button>
          {documents ? <ProfileDocuments type="Vehicle" id={vehicle.vehicleId} /> : null}
        </>
      ) : null}
    </article>
  );
}
function OrganizationProfile({ id }: { id: string }) {
  const load = useCallback((signal: AbortSignal) => foundationApi.organization(id, signal), [id]);
  const state = useFoundation(load);
  if (state.loading) return <Loading />;
  if (state.error) return <ErrorNotice error={state.error} retry={state.reload} />;
  if (!state.data) return null;
  return (
    <OrganizationProfileForm organization={state.data} busy={state.busy} mutate={state.mutate} />
  );
}
function OrganizationProfileForm({
  organization,
  busy,
  mutate,
}: {
  organization: Organization;
  busy: boolean;
  mutate: (action: () => Promise<unknown>) => Promise<boolean>;
}) {
  const [legalEntityType, setType] = useState(organization.legalEntityType || 'Enterprise');
  const [registeredAddress, setAddress] = useState(organization.registeredAddress || '');
  const [contactPhone, setPhone] = useState(organization.contactPhone || '');
  const [contactEmail, setEmail] = useState(organization.contactEmail || '');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void mutate(() =>
          foundationApi.organizationProfile(organization.id, {
            legalEntityType,
            registeredAddress,
            contactPhone,
            contactEmail,
          }),
        );
      }}
    >
      <h3>Bổ sung thông tin tổ chức</h3>
      <label>
        Loại chủ thể
        <select value={legalEntityType} onChange={(e) => setType(e.target.value)}>
          <option value="Enterprise">Doanh nghiệp</option>
          <option value="Cooperative">Hợp tác xã</option>
          <option value="HouseholdBusiness">Hộ kinh doanh</option>
        </select>
      </label>
      <label>
        Địa chỉ
        <input
          required
          maxLength={500}
          value={registeredAddress}
          onChange={(e) => setAddress(e.target.value)}
        />
      </label>
      <label>
        Số liên hệ
        <input
          required
          maxLength={20}
          value={contactPhone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>
      <label>
        Email liên hệ
        <input
          required
          type="email"
          value={contactEmail}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <button disabled={busy}>Lưu hồ sơ</button>
    </form>
  );
}
