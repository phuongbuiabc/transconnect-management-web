import { cellAt, cellTypeLabels, type Grid } from '../models/seatGrid';
import type { Cell } from '../models/transport';
import '../transport.css';

/**
 * Vẽ sơ đồ ghế theo tầng. Chế độ:
 * - view: chỉ xem;
 * - edit: bấm ô để chọn ô đang sửa (`active`);
 * - pick: bấm ghế bán được để chọn/bỏ chọn theo mã (`picked`).
 */
export function SeatGrid({
  grid,
  mode = 'view',
  active,
  picked,
  onCell,
}: {
  grid: Pick<Grid, 'decks' | 'cells'>;
  mode?: 'view' | 'edit' | 'pick';
  active?: { deckNo: number; row: number; col: number } | null;
  picked?: string[];
  onCell?: (cell: Cell) => void;
}) {
  const full = { name: '', layoutKind: 'Seater' as const, ...grid };
  return (
    <div className="seat-decks">
      {grid.decks.map((deck) => (
        <figure key={deck.deckNo} className="seat-deck">
          <figcaption>
            {grid.decks.length > 1 ? (deck.deckNo === 1 ? 'Tầng dưới' : 'Tầng trên') : 'Sơ đồ'}
            <small> · đầu xe ở trên</small>
          </figcaption>
          <div
            className="seat-grid"
            style={{ gridTemplateColumns: `repeat(${deck.columns}, minmax(2.5rem, 1fr))` }}
          >
            {Array.from({ length: deck.rows * deck.columns }, (_, index) => {
              const row = Math.floor(index / deck.columns) + 1;
              const col = (index % deck.columns) + 1;
              const cell = cellAt(full, deck.deckNo, row, col);
              const isSeat = cell.cellType === 'Seat';
              const label = isSeat ? cell.label || '?' : cellTypeLabels[cell.cellType];
              const isActive =
                active?.deckNo === deck.deckNo && active.row === row && active.col === col;
              const isPicked = isSeat && !!cell.label && !!picked?.includes(cell.label);
              const clickable = mode === 'edit' || (mode === 'pick' && isSeat && cell.isSellable);
              const className =
                'seat-cell cell-' +
                cell.cellType.toLowerCase() +
                (isSeat && cell.seatClass === 'Vip' ? ' is-vip' : '') +
                (isSeat && !cell.isSellable ? ' not-sellable' : '') +
                (isActive ? ' is-active' : '') +
                (isPicked ? ' is-picked' : '');
              const title =
                `Hàng ${row}, cột ${col}: ${cellTypeLabels[cell.cellType]}` +
                (isSeat
                  ? ` ${cell.label ?? ''}${cell.seatClass === 'Vip' ? ' (VIP)' : ''}${cell.isSellable ? '' : ' (không bán)'}`
                  : '');
              return clickable ? (
                <button
                  key={index}
                  type="button"
                  className={className}
                  title={title}
                  aria-label={title}
                  aria-pressed={mode === 'pick' ? isPicked : isActive}
                  onClick={() => onCell?.(cell)}
                >
                  {label}
                </button>
              ) : (
                <span key={index} className={className} title={title}>
                  {isSeat || cell.cellType === 'Driver' || cell.cellType === 'Door' ? label : ''}
                </span>
              );
            })}
          </div>
        </figure>
      ))}
    </div>
  );
}
