import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/loadTypeScript.mjs';
const trips = await loadTypeScript(
  new URL('../src/features/transport/models/trips.ts', import.meta.url),
);

const base = {
  status: 'Scheduled',
  vehicleId: null,
  crew: [],
  order: null,
  serviceDate: '2026-12-01',
  departureAt: '2026-12-01T01:00:00Z',
};

test('UTC times without suffix are read as UTC and shown in Vietnam time', () => {
  assert.equal(trips.vietnamTime('2026-12-01T01:30:00'), '08:30');
  assert.equal(trips.vietnamTime('2026-12-01T01:30:00Z'), '08:30');
  assert.equal(trips.vietnamDateTime('2026-11-30T17:05:00Z'), '01/12 00:05');
});

test('service date labels and day arithmetic cross month boundaries', () => {
  assert.equal(trips.serviceDateLabel('2026-12-01'), 'T3 01/12');
  assert.equal(trips.addDays('2026-11-28', 6), '2026-12-04');
  assert.equal(trips.addDays('2026-12-04', -7), '2026-11-27');
});

test('readiness lists what blocks departure, in backend order', () => {
  assert.deepEqual(trips.tripReadiness(base), [
    'Chưa gán xe',
    'Chưa có tài xế chính',
    'Chưa cấp lệnh vận chuyển',
  ]);
  const ready = {
    ...base,
    vehicleId: 'v',
    crew: [{ driverId: 'd', name: 'A', role: 'Primary' }],
    order: { status: 'Issued' },
  };
  assert.deepEqual(trips.tripReadiness(ready), ['Tài xế chưa nhận lệnh']);
  assert.deepEqual(trips.tripReadiness({ ...ready, order: { status: 'Acknowledged' } }), []);
  assert.deepEqual(trips.tripReadiness({ ...base, status: 'Cancelled' }), []);
});

test('crew rules reject one person in two roles and helpers without a primary', () => {
  assert.deepEqual(
    trips.crewProblems({ primaryDriverId: 'a', secondaryDriverId: 'a', attendantDriverId: null }),
    ['Một người chỉ giữ một vai trò.'],
  );
  assert.deepEqual(
    trips.crewProblems({ primaryDriverId: null, secondaryDriverId: 'b', attendantDriverId: null }),
    ['Chọn tài xế chính trước.'],
  );
  assert.deepEqual(
    trips.crewProblems({ primaryDriverId: null, secondaryDriverId: null, attendantDriverId: null }),
    [],
  );
});

test('quick trip needs a route, a date from today and HH:mm', () => {
  const input = {
    routeId: 'r',
    serviceDate: '2026-12-01',
    departureTime: '07:30',
    participationMode: 'RequestConfirmation',
    vehicleId: null,
    primaryDriverId: null,
  };
  assert.deepEqual(trips.quickTripProblems(input, '2026-12-01'), []);
  assert.equal(
    trips.quickTripProblems({ ...input, serviceDate: '2026-11-30' }, '2026-12-01').length,
    1,
  );
  assert.equal(trips.quickTripProblems({ ...input, departureTime: '7:3' }, '2026-12-01').length, 1);
});

test('trips are grouped per service date and sorted by departure', () => {
  const groups = trips.groupByDate([
    { ...base, id: 2, serviceDate: '2026-12-02', departureAt: '2026-12-02T03:00:00Z' },
    { ...base, id: 1, departureAt: '2026-12-01T05:00:00Z' },
    { ...base, id: 0, departureAt: '2026-12-01T01:00:00Z' },
  ]);
  assert.deepEqual(
    groups.map(([d, list]) => [d, list.map((t) => t.id)]),
    [
      ['2026-12-01', [0, 1]],
      ['2026-12-02', [2]],
    ],
  );
});

test('verify path encodes the public code', () => {
  assert.equal(trips.verifyPath('a_b-C'), '/verify/a_b-C');
  assert.equal(trips.verifyPath('a/b'), '/verify/a%2Fb');
});
