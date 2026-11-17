import type { Cell, CellType, Deck, SeatLayout, SeatLayoutInput } from './transport';

/** Giới hạn khớp Backend SeatLayoutService.Validate. */
export const MAX_ROWS = 20;
export const MAX_COLUMNS = 6;

export const cellCycle: CellType[] = ['Seat', 'Aisle', 'Empty', 'Driver', 'Door'];

export const cellTypeLabels: Record<CellType, string> = {
  Seat: 'Ghế',
  Aisle: 'Lối đi',
  Empty: 'Trống',
  Driver: 'Tài xế',
  Door: 'Cửa',
};

export interface Grid {
  name: string;
  layoutKind: SeatLayoutInput['layoutKind'];
  decks: Deck[];
  cells: Cell[];
}

const key = (deckNo: number, row: number, col: number) => deckNo + ':' + row + ':' + col;

export function cellAt(grid: Grid, deckNo: number, row: number, col: number): Cell {
  return (
    grid.cells.find((c) => c.deckNo === deckNo && c.row === row && c.col === col) ?? {
      deckNo,
      row,
      col,
      cellType: 'Empty',
      label: null,
      seatClass: null,
      isSellable: false,
    }
  );
}

export function fromLayout(layout: SeatLayout): Grid {
  return {
    name: layout.name,
    layoutKind: layout.layoutKind,
    decks: layout.decks.map((d) => ({ ...d })),
    cells: layout.cells.map((c) => ({ ...c })),
  };
}

/** Lưới mới: toàn bộ là ghế, cột giữa là lối đi khi có từ 4 cột. */
export function blankGrid(rows: number, columns: number, deckCount: 1 | 2): Grid {
  const decks: Deck[] = Array.from({ length: deckCount }, (_, i) => ({
    deckNo: i + 1,
    rows: clamp(rows, 1, MAX_ROWS),
    columns: clamp(columns, 1, MAX_COLUMNS),
  }));
  const aisle = decks[0].columns >= 4 ? Math.ceil(decks[0].columns / 2) : -1;
  const cells: Cell[] = [];
  for (const deck of decks)
    for (let row = 1; row <= deck.rows; row++)
      for (let col = 1; col <= deck.columns; col++)
        cells.push({
          deckNo: deck.deckNo,
          row,
          col,
          cellType: col === aisle ? 'Aisle' : 'Seat',
          label: null,
          seatClass: col === aisle ? null : 'Standard',
          isSellable: col !== aisle,
        });
  return autoLabel({ name: '', layoutKind: 'Seater', decks, cells });
}

/** Đổi kích thước tầng; giữ các ô còn nằm trong lưới. */
export function resizeDeck(grid: Grid, deckNo: number, rows: number, columns: number): Grid {
  const decks = grid.decks.map((d) =>
    d.deckNo === deckNo
      ? { ...d, rows: clamp(rows, 1, MAX_ROWS), columns: clamp(columns, 1, MAX_COLUMNS) }
      : d,
  );
  const size = new Map(decks.map((d) => [d.deckNo, d]));
  return {
    ...grid,
    decks,
    cells: grid.cells.filter((c) => {
      const d = size.get(c.deckNo);
      return d !== undefined && c.row <= d.rows && c.col <= d.columns;
    }),
  };
}

export function setDeckCount(grid: Grid, count: 1 | 2): Grid {
  if (count === grid.decks.length) return grid;
  if (count === 1)
    return { ...grid, decks: [grid.decks[0]], cells: grid.cells.filter((c) => c.deckNo === 1) };
  const upper = { ...grid.decks[0], deckNo: 2 };
  const copied = grid.cells.filter((c) => c.deckNo === 1).map((c) => ({ ...c, deckNo: 2 }));
  return autoLabel({ ...grid, decks: [grid.decks[0], upper], cells: [...grid.cells, ...copied] });
}

export function updateCell(grid: Grid, next: Cell): Grid {
  const target = key(next.deckNo, next.row, next.col);
  const others = grid.cells.filter((c) => key(c.deckNo, c.row, c.col) !== target);
  const normalized: Cell =
    next.cellType === 'Seat'
      ? { ...next, seatClass: next.seatClass ?? 'Standard' }
      : { ...next, label: null, seatClass: null, isSellable: false };
  return { ...grid, cells: [...others, normalized] };
}

/** Chuyển loại ô theo vòng Ghế → Lối đi → Trống → Tài xế → Cửa. */
export function cycleCell(grid: Grid, deckNo: number, row: number, col: number): Grid {
  const current = cellAt(grid, deckNo, row, col);
  const type = cellCycle[(cellCycle.indexOf(current.cellType) + 1) % cellCycle.length];
  const next: Cell = { ...current, cellType: type };
  if (type === 'Seat') {
    next.isSellable = true;
    next.label = nextFreeLabel(grid, deckNo);
  }
  return updateCell(grid, next);
}

/** Đánh số lại toàn bộ ghế: tầng 1 là A01.., tầng 2 là B01.. theo hàng rồi cột. */
export function autoLabel(grid: Grid): Grid {
  const counters = new Map<number, number>();
  const sorted = [...grid.cells].sort(
    (a, b) => a.deckNo - b.deckNo || a.row - b.row || a.col - b.col,
  );
  return {
    ...grid,
    cells: sorted.map((c) => {
      if (c.cellType !== 'Seat') return c;
      const n = (counters.get(c.deckNo) ?? 0) + 1;
      counters.set(c.deckNo, n);
      return { ...c, label: deckPrefix(c.deckNo) + String(n).padStart(2, '0') };
    }),
  };
}

export function seatSummary(grid: Pick<Grid, 'cells'>) {
  const seats = grid.cells.filter((c) => c.cellType === 'Seat');
  return {
    seats: seats.length,
    sellable: seats.filter((c) => c.isSellable).length,
    vip: seats.filter((c) => c.seatClass === 'Vip').length,
  };
}

/** Lỗi phát hiện trước khi gửi; Backend vẫn là nơi kiểm tra cuối cùng. */
export function gridProblems(grid: Grid): string[] {
  const problems: string[] = [];
  if (!grid.name.trim()) problems.push('Nhập tên sơ đồ.');
  const labels = new Map<string, number>();
  for (const c of grid.cells) {
    if (c.cellType !== 'Seat') continue;
    const label = (c.label ?? '').trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9-]{0,9}$/.test(label))
      problems.push(`Ghế hàng ${c.row}, cột ${c.col} (tầng ${c.deckNo}) cần mã 1–10 ký tự.`);
    labels.set(label, (labels.get(label) ?? 0) + 1);
  }
  for (const [label, count] of labels)
    if (label && count > 1) problems.push(`Mã ghế ${label} bị trùng.`);
  if (!seatSummary(grid).sellable) problems.push('Sơ đồ cần ít nhất một ghế bán.');
  return problems;
}

export function toInput(grid: Grid): SeatLayoutInput {
  return {
    name: grid.name.trim(),
    layoutKind: grid.layoutKind,
    decks: grid.decks,
    cells: grid.cells
      .filter((c) => c.cellType !== 'Empty')
      .map((c) => ({
        ...c,
        label: c.cellType === 'Seat' ? (c.label ?? '').trim().toUpperCase() : null,
      })),
  };
}

function nextFreeLabel(grid: Grid, deckNo: number) {
  const used = new Set(grid.cells.map((c) => (c.label ?? '').toUpperCase()));
  for (let n = 1; n < 1000; n++) {
    const label = deckPrefix(deckNo) + String(n).padStart(2, '0');
    if (!used.has(label)) return label;
  }
  return null;
}

const deckPrefix = (deckNo: number) => (deckNo === 2 ? 'B' : 'A');

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value) || min));
}
