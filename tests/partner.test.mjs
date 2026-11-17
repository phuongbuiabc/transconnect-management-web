import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/loadTypeScript.mjs';
const { partnerStage, isOpenInvitation, invitationState } = await loadTypeScript(
  new URL('../src/features/partner/models/partnerStage.ts', import.meta.url),
);
const org = (reviewStatus) => ({ id: reviewStatus, name: reviewStatus, reviewStatus });
const membership = { organizationId: 'o', organizationName: 'O', role: 'Manager', isActive: true };
const stage = (input) =>
  partnerStage({
    emailVerified: true,
    membership: null,
    driverId: null,
    applications: [],
    ...input,
  });

test('partner stage follows verification, driver account, application and membership', () => {
  assert.equal(stage({ emailVerified: false, membership }), 'verify-email');
  assert.equal(stage({ membership, driverId: 'd' }), 'member');
  assert.equal(stage({ driverId: 'd' }), 'driver-account');
  assert.equal(stage({}), 'no-application');
  assert.equal(stage({ applications: [org('Rejected'), org('Pending')] }), 'pending');
  assert.equal(stage({ applications: [org('Approved'), org('Rejected')] }), 'rejected');
  assert.equal(stage({ applications: [org('Approved')] }), 'approved-awaiting-owner');
});

test('only unaccepted, unrevoked, unexpired invitations are open', () => {
  const now = new Date('2026-11-10T00:00:00Z');
  const base = { acceptedAt: null, revokedAt: null, expiresAt: '2026-11-11T00:00:00Z' };
  assert.equal(isOpenInvitation(base, now), true);
  assert.equal(invitationState(base, now), 'Chờ nhận');
  assert.equal(isOpenInvitation({ ...base, acceptedAt: '2026-11-09' }, now), false);
  assert.equal(invitationState({ ...base, revokedAt: '2026-11-09' }, now), 'Đã thu hồi');
  assert.equal(invitationState({ ...base, expiresAt: '2026-11-09T00:00:00Z' }, now), 'Hết hạn');
});
