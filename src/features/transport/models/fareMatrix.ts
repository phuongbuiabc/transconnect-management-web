import type { FareInput, FareStop, FareTable } from './transport';

/** Giới hạn khớp Backend FareService.MaxPrice; giá nhập theo nghìn đồng nên luôn là bội số 1.000 đ (009A). */
export const MAX_PRICE = 50_000_000;

export interface FareCell {
  /** Giá ghế thường, nghìn đồng, dạng chuỗi đang gõ. */
  price: string;
  /** Ghi đè giá ghế Vip, nghìn đồng; trống = giá thường + phụ thu. */
  vipPrice: string;
}

export interface FareDraft {
  effectiveFrom: string;
  /** Phụ thu Vip, nghìn đồng. */
  vipSurcharge: string;
  note: string;
  cells: Record<string, FareCell>;
}

export const pairKey = (from: string, to: string) => from + '>' + to;

/** Các cặp định giá theo 002A: điểm i cho đón, điểm j sau nó cho trả. */
export function farePairs(stops: FareStop[]) {
  const sorted = [...stops].sort((a, b) => a.sequence - b.sequence);
  const pairs: { from: FareStop; to: FareStop }[] = [];
  sorted.forEach((from, i) => {
    if (!from.allowPickup) return;
    for (const to of sorted.slice(i + 1)) if (to.allowDropoff) pairs.push({ from, to });
  });
  return pairs;
}

/** Hàng = điểm đón (bỏ điểm cuối), cột = điểm trả (bỏ điểm đầu), như bảng giá ở bến. */
export function matrixAxes(stops: FareStop[]) {
  const sorted = [...stops].sort((a, b) => a.sequence - b.sequence);
  return { rows: sorted.slice(0, -1), columns: sorted.slice(1) };
}

export function isPriceable(from: FareStop, to: FareStop) {
  return from.allowPickup && to.allowDropoff && from.sequence < to.sequence;
}

const thousands = (value: number) => String(Math.round(value / 1000));

export function draftFromTable(table: FareTable): FareDraft {
  const cells: Record<string, FareCell> = {};
  for (const p of table.prices ?? [])
    cells[pairKey(p.fromLocationId, p.toLocationId)] = {
      price: thousands(p.price),
      vipPrice: p.vipPrice === null ? '' : thousands(p.vipPrice),
    };
  return {
    effectiveFrom: table.effectiveFrom,
    vipSurcharge: thousands(table.vipSurcharge),
    note: table.note ?? '',
    cells,
  };
}

/** Chuỗi nghìn đồng → VNĐ; trống → null; sai định dạng → NaN. */
export function parseThousands(value: string): number | null {
  const text = value.trim().replace(/[.\s]/g, '');
  if (!text) return null;
  if (!/^\d+$/.test(text)) return Number.NaN;
  return Number(text) * 1000;
}

export function fareProblems(draft: FareDraft, stops: FareStop[]): string[] {
  const problems: string[] = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.effectiveFrom)) problems.push('Chọn ngày áp dụng.');
  const surcharge = parseThousands(draft.vipSurcharge);
  if (surcharge !== null && !(surcharge >= 0 && surcharge <= MAX_PRICE))
    problems.push('Phụ thu Vip là số nghìn đồng không âm.');
  for (const { from, to } of farePairs(stops)) {
    const cell = draft.cells[pairKey(from.sharedLocationId, to.sharedLocationId)];
    if (!cell) continue;
    const price = parseThousands(cell.price);
    const vip = parseThousands(cell.vipPrice);
    const label = from.name + ' → ' + to.name;
    if (price === null && vip !== null)
      problems.push(label + ': nhập giá thường trước khi ghi đè giá Vip.');
    if (price !== null && !(price > 0 && price <= MAX_PRICE))
      problems.push(label + ': giá phải lớn hơn 0 và không quá 50.000 nghìn đồng.');
    if (vip !== null && !(vip > 0 && vip <= MAX_PRICE))
      problems.push(label + ': giá Vip không hợp lệ.');
  }
  return problems;
}

/** Thiếu giá điểm đầu → điểm cuối thì chưa công bố được (003A). */
export function missingFirstToLast(draft: FareDraft, stops: FareStop[]) {
  const sorted = [...stops].sort((a, b) => a.sequence - b.sequence);
  if (sorted.length < 2) return true;
  const cell =
    draft.cells[pairKey(sorted[0].sharedLocationId, sorted[sorted.length - 1].sharedLocationId)];
  return !cell || parseThousands(cell.price) === null;
}

export function fareToInput(draft: FareDraft, stops: FareStop[]): FareInput {
  const prices: FareInput['prices'] = [];
  for (const { from, to } of farePairs(stops)) {
    const cell = draft.cells[pairKey(from.sharedLocationId, to.sharedLocationId)];
    const price = cell ? parseThousands(cell.price) : null;
    if (price === null || Number.isNaN(price)) continue;
    const vip = parseThousands(cell.vipPrice);
    prices.push({
      fromLocationId: from.sharedLocationId,
      toLocationId: to.sharedLocationId,
      price,
      vipPrice: vip === null || Number.isNaN(vip) ? null : vip,
    });
  }
  return {
    effectiveFrom: draft.effectiveFrom,
    vipSurcharge: parseThousands(draft.vipSurcharge) ?? 0,
    note: draft.note.trim(),
    prices,
  };
}

export const farePhaseLabels: Record<string, string> = {
  Current: 'Đang áp dụng',
  Upcoming: 'Sắp áp dụng',
  Past: 'Đã hết áp dụng',
};
