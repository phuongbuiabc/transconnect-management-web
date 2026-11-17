import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/loadTypeScript.mjs';
const grid = await loadTypeScript(
  new URL('../src/features/transport/models/seatGrid.ts', import.meta.url),
);
const rules = await loadTypeScript(
  new URL('../src/features/transport/models/scheduleRules.ts', import.meta.url),
);
const transport = await loadTypeScript(
  new URL('../src/features/transport/models/transport.ts', import.meta.url),
);

test('blank grid puts an aisle in the middle and numbers seats per deck', () => {
  const g = grid.blankGrid(2, 5, 2);
  assert.equal(g.decks.length, 2);
  const lower = g.cells.filter((c) => c.deckNo === 1 && c.cellType === 'Seat');
  assert.equal(lower.length, 8);
  assert.equal(grid.cellAt(g, 1, 1, 3).cellType, 'Aisle');
  assert.deepEqual(
    lower.map((c) => c.label),
    ['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08'],
  );
  assert.equal(g.cells.find((c) => c.deckNo === 2 && c.cellType === 'Seat').label, 'B01');
});

test('grid size is clamped to the backend limit and resize drops outside cells', () => {
  const g = grid.blankGrid(50, 9, 1);
  assert.equal(g.decks[0].rows, grid.MAX_ROWS);
  assert.equal(g.decks[0].columns, grid.MAX_COLUMNS);
  const small = grid.resizeDeck(g, 1, 2, 2);
  assert.ok(small.cells.every((c) => c.row <= 2 && c.col <= 2));
});

test('cycling a cell and non-seat cells clear label and sellable flag', () => {
  let g = grid.blankGrid(1, 2, 1);
  g = grid.cycleCell(g, 1, 1, 1);
  const aisle = grid.cellAt(g, 1, 1, 1);
  assert.equal(aisle.cellType, 'Aisle');
  assert.equal(aisle.label, null);
  assert.equal(aisle.isSellable, false);
  for (let i = 0; i < 4; i++) g = grid.cycleCell(g, 1, 1, 1);
  const seat = grid.cellAt(g, 1, 1, 1);
  assert.equal(seat.cellType, 'Seat');
  assert.ok(seat.label && seat.label !== grid.cellAt(g, 1, 1, 2).label);
});

test('grid problems catch name, duplicate labels and no sellable seat', () => {
  let g = { ...grid.blankGrid(1, 2, 1), name: '' };
  assert.ok(grid.gridProblems(g).some((p) => p.includes('tên')));
  g = { ...g, name: 'Xe 2 chỗ' };
  const [a, b] = g.cells;
  g = grid.updateCell(g, { ...b, label: a.label });
  assert.ok(grid.gridProblems(g).some((p) => p.includes('trùng')));
  g = grid.autoLabel(g);
  g = grid.updateCell(g, { ...grid.cellAt(g, 1, 1, 1), isSellable: false });
  g = grid.updateCell(g, { ...grid.cellAt(g, 1, 1, 2), isSellable: false });
  assert.ok(grid.gridProblems(g).some((p) => p.includes('ghế bán')));
});

test('toInput drops empty cells and uppercases labels', () => {
  let g = { ...grid.blankGrid(1, 2, 1), name: ' X ' };
  g = grid.updateCell(g, { ...grid.cellAt(g, 1, 1, 1), label: 'a1' });
  g = grid.updateCell(g, { ...grid.cellAt(g, 1, 1, 2), cellType: 'Empty' });
  const input = grid.toInput(g);
  assert.equal(input.name, 'X');
  assert.equal(input.cells.length, 1);
  assert.equal(input.cells[0].label, 'A1');
});

test('coach access prefers the live registration over withdrawn history', () => {
  const reg = (status, submittedAt) => ({
    serviceTypeCode: transport.COACH,
    status,
    submittedAt,
  });
  assert.equal(rules.coachAccess([]).canView, false);
  const access = rules.coachAccess([
    reg('Withdrawn', '2026-11-01T00:00:00Z'),
    reg('Approved', '2026-11-02T00:00:00Z'),
  ]);
  assert.equal(access.canOperate, true);
  assert.equal(rules.coachAccess([reg('Suspended', 'x')]).canView, true);
  assert.equal(rules.coachAccess([reg('Suspended', 'x')]).canOperate, false);
  assert.equal(rules.coachAccess([reg('Pending', 'x')]).canView, false);
});

test('publish problems mirror backend route publish rules', () => {
  const stop = (offsetMinutes, allowPickup = true, allowDropoff = true) => ({
    sharedLocationId: String(offsetMinutes),
    name: 'S',
    addressDetail: '',
    allowPickup,
    allowDropoff,
    offsetMinutes,
    dwellMinutes: null,
  });
  assert.ok(rules.publishProblems([stop(0)]).length > 0);
  assert.deepEqual(rules.publishProblems([stop(0, true, false), stop(90, false, true)]), []);
  assert.ok(rules.publishProblems([stop(5), stop(90)]).some((p) => p.includes('0 phút')));
  assert.ok(rules.publishProblems([stop(0), stop(0)]).some((p) => p.includes('lớn hơn')));
  assert.ok(rules.publishProblems([stop(0, false), stop(30)]).some((p) => p.includes('đón')));
});

test('schedule problems require vehicle for VieGo seats and seats for instant booking', () => {
  const base = rules.emptySchedule('r1', '2026-11-13');
  assert.deepEqual(rules.scheduleProblems(base), []);
  assert.ok(rules.scheduleProblems({ ...base, departureTime: '25:00' }).length);
  assert.ok(rules.scheduleProblems({ ...base, daysOfWeek: [] }).length);
  assert.ok(rules.scheduleProblems({ ...base, effectiveTo: '2026-11-01' }).length);
  assert.ok(rules.scheduleProblems({ ...base, vieGoSeats: ['A01'] }).length);
  assert.ok(rules.scheduleProblems({ ...base, participationMode: 'InstantBooking' }).length);
  assert.deepEqual(
    rules.scheduleProblems({
      ...base,
      participationMode: 'InstantBooking',
      plannedVehicleId: 'v',
      vieGoSeats: ['A01'],
    }),
    [],
  );
});

test('days and Vietnam date follow backend conventions', () => {
  assert.equal(rules.formatDays([1, 2, 3, 4, 5, 6, 7]), 'Hằng ngày');
  assert.equal(rules.formatDays([7, 1]), 'T2, CN');
  assert.equal(rules.vietnamToday(new Date('2026-11-13T18:30:00Z')), '2026-11-14');
  assert.equal(transport.serviceTypeLabel('CHARTER'), 'Thuê nguyên xe / xe hợp đồng');
});

const fare = await loadTypeScript(
  new URL('../src/features/transport/models/fareMatrix.ts', import.meta.url),
);

const fareStops = [
  { sharedLocationId: 'a', sequence: 1, name: 'A', allowPickup: true, allowDropoff: false },
  { sharedLocationId: 'b', sequence: 2, name: 'B', allowPickup: true, allowDropoff: true },
  { sharedLocationId: 'c', sequence: 3, name: 'C', allowPickup: false, allowDropoff: true },
];

test('fare pairs follow pickup before dropoff on the triangular matrix', () => {
  const pairs = fare.farePairs(fareStops).map((p) => p.from.name + p.to.name);
  assert.deepEqual(pairs, ['AB', 'AC', 'BC']);
  const axes = fare.matrixAxes(fareStops);
  assert.deepEqual(
    axes.rows.map((s) => s.name),
    ['A', 'B'],
  );
  assert.deepEqual(
    axes.columns.map((s) => s.name),
    ['B', 'C'],
  );
});

test('fare draft converts thousands to VND, drops blanks and requires first to last', () => {
  const draft = {
    effectiveFrom: '2026-12-01',
    vipSurcharge: '50',
    note: ' Tết ',
    cells: {
      'a>b': { price: '150', vipPrice: '' },
      'b>c': { price: '', vipPrice: '' },
    },
  };
  assert.equal(fare.missingFirstToLast(draft, fareStops), true);
  draft.cells['a>c'] = { price: '300', vipPrice: '380' };
  assert.equal(fare.missingFirstToLast(draft, fareStops), false);
  assert.deepEqual(fare.fareProblems(draft, fareStops), []);
  const input = fare.fareToInput(draft, fareStops);
  assert.equal(input.vipSurcharge, 50_000);
  assert.equal(input.note, 'Tết');
  assert.deepEqual(input.prices, [
    { fromLocationId: 'a', toLocationId: 'b', price: 150_000, vipPrice: null },
    { fromLocationId: 'a', toLocationId: 'c', price: 300_000, vipPrice: 380_000 },
  ]);
  draft.cells['a>b'].price = '1,5';
  assert.equal(fare.fareProblems(draft, fareStops).length, 1);
});
