import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/loadTypeScript.mjs';
const reg = await loadTypeScript(
  new URL('../src/features/partner/models/registration.ts', import.meta.url),
);
const step = (input) =>
  reg.registrationStep({
    signedIn: true,
    emailVerified: true,
    stage: 'no-application',
    local: 'organization',
    justSubmitted: false,
    ...input,
  });
const draft = (patch) => ({
  ...reg.emptyDraft,
  name: 'Nhà xe A',
  registrationNumber: '0123456789',
  ...patch,
});

test('registration step follows session, verification and server stage', () => {
  assert.equal(step({ signedIn: false }), 'account');
  assert.equal(step({ emailVerified: false }), 'verify');
  assert.equal(step({ local: 'services' }), 'services');
  assert.equal(step({ stage: 'rejected', local: 'review' }), 'review');
  assert.equal(step({ stage: 'pending' }), 'submitted');
  assert.equal(step({ justSubmitted: true }), 'submitted');
  for (const stage of ['member', 'driver-account', 'approved-awaiting-owner'])
    assert.equal(step({ stage }), 'leave');
});

test('organization validation requires name and tax code; profile fields are optional but checked', () => {
  assert.deepEqual(reg.validateOrganization(draft()), {});
  assert.ok(reg.validateOrganization(draft({ name: ' ' })).name);
  assert.ok(
    reg.validateOrganization(draft({ registrationNumber: '01234567890' })).registrationNumber,
  );
  assert.deepEqual(reg.validateOrganization(draft({ registrationNumber: '0123456789012' })), {});
  assert.ok(reg.validateOrganization(draft({ contactPhone: 'abc' })).contactPhone);
  assert.ok(reg.validateOrganization(draft({ contactEmail: 'x@' })).contactEmail);
  assert.deepEqual(
    reg.validateOrganization(draft({ contactPhone: '+84 90-123 4567', contactEmail: 'a@b.vn' })),
    {},
  );
  assert.ok(reg.validateServices(draft()).requestedServiceTypes);
  assert.deepEqual(reg.validateServices(draft({ requestedServiceTypes: ['CHARTER'] })), {});
});

test('payload trims, lowercases contact email and sends empty optional fields as null', () => {
  const body = reg.submitPayload(
    draft({ name: ' A ', contactEmail: ' Info@X.VN ', requestedServiceTypes: ['CHARTER'] }),
  );
  assert.equal(body.name, 'A');
  assert.equal(body.contactEmail, 'info@x.vn');
  assert.equal(body.legalEntityType, null);
  assert.equal(body.registeredAddress, null);
  assert.equal('resubmitId' in body, false);
});

test('rejected application prefills the draft; stored drafts are sanitized', () => {
  const rejected = {
    id: 'r1',
    name: 'Cũ',
    registrationNumber: '0123456789',
    reviewStatus: 'Rejected',
    legalEntityType: 'Cooperative',
    requestedServiceTypes: ['FIXED_ROUTE_COACH'],
  };
  assert.equal(reg.rejectedApplication([rejected]).id, 'r1');
  assert.equal(reg.rejectedApplication([{ ...rejected, reviewStatus: 'Pending' }, rejected]), null);
  const filled = reg.draftFromOrganization(rejected);
  assert.equal(filled.resubmitId, 'r1');
  assert.equal(filled.contactPhone, '');
  assert.equal(reg.parseDraft('not json'), null);
  const parsed = reg.parseDraft(
    JSON.stringify({ name: 'A', password: 'x', requestedServiceTypes: ['CHARTER', 3] }),
  );
  assert.equal(parsed.name, 'A');
  assert.equal('password' in parsed, false);
  assert.deepEqual(parsed.requestedServiceTypes, ['CHARTER']);
});
