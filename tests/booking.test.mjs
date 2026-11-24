import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/loadTypeScript.mjs';
const booking = await loadTypeScript(
  new URL('../src/features/booking/models/booking.ts', import.meta.url),
);

// A-B-C-D: A chỉ đón, D chỉ trả, B/C đón và trả.
const stops = [
  { sequence: 1, name: 'A', allowPickup: true, allowDropoff: false },
  { sequence: 2, name: 'B', allowPickup: true, allowDropoff: true },
  { sequence: 3, name: 'C', allowPickup: true, allowDropoff: true },
  { sequence: 4, name: 'D', allowPickup: false, allowDropoff: true },
];

test('segment pickers follow the operator stop rules', () => {
  assert.deepEqual(
    booking.pickupStops(stops).map((s) => s.name),
    ['A', 'B', 'C'],
  );
  assert.deepEqual(
    booking.dropoffStops(stops, 2).map((s) => s.name),
    ['C', 'D'],
  );
  assert.deepEqual(booking.defaultSegment(stops), { from: 1, to: 4 });
  assert.equal(booking.defaultSegment([stops[0]]), null);
});

test('changing pickup keeps a still-valid dropoff, else falls back to the last stop', () => {
  assert.equal(booking.adjustDropoff(stops, 2, 3), 3);
  assert.equal(booking.adjustDropoff(stops, 3, 2), 4);
});

test('seat decks, picking and totals', () => {
  const seats = [
    { label: 'A01', deckNo: 1, row: 1, col: 1, price: 200000 },
    { label: 'A02', deckNo: 1, row: 2, col: 3, price: 250000 },
    { label: 'B01', deckNo: 2, row: 1, col: 2, price: 200000 },
  ];
  const decks = booking.seatDecks(seats);
  assert.deepEqual(
    decks.map((d) => [d.deckNo, d.rows, d.columns, d.seats.length]),
    [
      [1, 2, 3, 2],
      [2, 1, 2, 1],
    ],
  );
  let picked = booking.toggleSeat([], 'A01');
  picked = booking.toggleSeat(picked, 'A02');
  assert.equal(booking.pickedTotal(seats, picked), 450000);
  assert.deepEqual(booking.toggleSeat(picked, 'A01'), ['A02']);
});

test('summary counts held/confirmed seats, pending requests and confirmed revenue', () => {
  const b = (status, seats, totalAmount) => ({ status, seats, totalAmount });
  assert.deepEqual(
    booking.bookingSummary([
      b('Confirmed', ['A01', 'A02'], 400000),
      b('Held', ['A03'], 200000),
      b('Requested', [], 200000),
      b('Cancelled', ['A04'], 200000),
      b('Completed', ['A05'], 150000),
    ]),
    { seats: 3, confirmed: 1, pending: 1, revenue: 550000 },
  );
});

test('phone validation mirrors the backend 9–15 digit rule', () => {
  assert.equal(booking.validPhone('0912 345 678'), true);
  assert.equal(booking.validPhone('+84912345678'), true);
  assert.equal(booking.validPhone('12345'), false);
  assert.equal(booking.validPhone('09123abc78'), false);
});
