import { useState, type ReactNode } from 'react';
import { ErrorNotice, Loading } from '../../../shared/ui';
import { EmptyRecords } from '../../../shared/ui/RecordLayout';
import type { Vehicle } from '../../foundation/models/foundation';
import { transportApi } from '../api/transportApi';
import { useSeatLayouts } from '../hooks/useTransport';
import {
  autoLabel,
  blankGrid,
  cellAt,
  cellCycle,
  cellTypeLabels,
  fromLayout,
  gridProblems,
  MAX_COLUMNS,
  MAX_ROWS,
  resizeDeck,
  seatSummary,
  setDeckCount,
  toInput,
  updateCell,
  type Grid,
} from '../models/seatGrid';
import {
  layoutKindLabels,
  type LayoutKind,
  type SeatLayout,
  type VehicleSeatLayout,
} from '../models/transport';
import { SeatGrid } from './SeatGrid';
import { TransportStatus } from './TransportStatus';

type Editing = { layout: SeatLayout | null; grid: Grid };

/** Sơ đồ ghế: sao chép mẫu hệ thống, sửa bản nháp, gắn vào từng xe (Q-M2-SERVICE-005a/b). */
export function SeatLayoutsWorkspace({
  organizationId,
  canOperate,
}: {
  organizationId: string;
  canOperate: boolean;
}) {
  const state = useSeatLayouts(organizationId);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [viewing, setViewing] = useState<SeatLayout | null>(null);
  if (state.loading) return <Loading />;
  if (!state.data) return <ErrorNotice error={state.error} retry={state.reload} />;
  const data = state.data;
  if (editing)
    return (
      <LayoutEditor
        initial={editing}
        busy={state.busy}
        error={state.error}
        onCancel={() => setEditing(null)}
        onSave={async (grid) => {
          const input = toInput(grid);
          const ok = await state.mutate(() =>
            editing.layout
              ? transportApi.updateLayout(organizationId, editing.layout, input)
              : transportApi.createLayout(organizationId, input),
          );
          if (ok) setEditing(null);
        }}
      />
    );
  const active = data.layouts.filter((l) => l.status !== 'Archived');
  return (
    <div className="partner-list">
      {state.error ? <ErrorNotice error={state.error} /> : null}
      {!canOperate ? (
        <p className="notice">Dịch vụ xe khách chưa được duyệt hoặc đang tạm ngưng: chỉ xem.</p>
      ) : null}
      <section className="panel">
        <div className="partner-stage-title">
          <h2>Sơ đồ của nhà xe</h2>
          {canOperate ? (
            <button
              type="button"
              className="button secondary"
              onClick={() => setEditing({ layout: null, grid: blankGrid(10, 5, 1) })}
            >
              Tạo sơ đồ trống
            </button>
          ) : null}
        </div>
        {active.length === 0 ? (
          <EmptyRecords
            title="Chưa có sơ đồ"
            description="Sao chép một mẫu hệ thống bên dưới rồi chỉnh theo xe thực tế."
          />
        ) : (
          <ul className="layout-cards">
            {active.map((layout) => (
              <LayoutCard
                key={layout.id}
                layout={layout}
                vehicles={data.vehicles}
                actions={
                  <>
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => setViewing(viewing?.id === layout.id ? null : layout)}
                    >
                      {viewing?.id === layout.id ? 'Ẩn' : 'Xem'}
                    </button>
                    {canOperate && layout.status === 'Draft' ? (
                      <button
                        type="button"
                        className="button primary"
                        onClick={() => setEditing({ layout, grid: fromLayout(layout) })}
                      >
                        Sửa
                      </button>
                    ) : null}
                    {canOperate ? (
                      <button
                        type="button"
                        className="button secondary"
                        disabled={state.busy}
                        onClick={() =>
                          void state.mutate(() =>
                            transportApi.copyLayout(
                              organizationId,
                              layout.id,
                              (layout.name + ' (bản sao)').slice(0, 200),
                            ),
                          )
                        }
                      >
                        Sao chép
                      </button>
                    ) : null}
                    {canOperate && layout.vehicleIds.length === 0 ? (
                      <button
                        type="button"
                        className="button danger-outline"
                        disabled={state.busy}
                        onClick={() =>
                          void state.mutate(() =>
                            transportApi.archiveLayout(organizationId, layout),
                          )
                        }
                      >
                        Lưu trữ
                      </button>
                    ) : null}
                  </>
                }
              />
            ))}
          </ul>
        )}
        {viewing ? <SeatGrid grid={viewing} /> : null}
      </section>
      <VehicleAttachments
        vehicles={data.vehicles}
        attached={data.attached}
        layouts={active}
        canOperate={canOperate}
        busy={state.busy}
        onAttach={(vehicleId, layoutId) =>
          state.mutate(() => transportApi.attachLayout(organizationId, vehicleId, layoutId))
        }
      />
      <section className="panel">
        <h2>Mẫu hệ thống</h2>
        <p className="partner-meta">
          Mẫu do VieGo cung cấp, không sửa trực tiếp. Sao chép về nhà xe để chỉnh mã ghế, hạng ghế
          và ghế không bán.
        </p>
        <ul className="layout-cards">
          {data.templates.map((template) => (
            <LayoutCard
              key={template.id}
              layout={template}
              vehicles={[]}
              actions={
                <>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => setViewing(viewing?.id === template.id ? null : template)}
                  >
                    {viewing?.id === template.id ? 'Ẩn' : 'Xem'}
                  </button>
                  {canOperate ? (
                    <button
                      type="button"
                      className="button primary"
                      disabled={state.busy}
                      onClick={() =>
                        void state.mutate(() =>
                          transportApi.copyLayout(organizationId, template.id, template.name),
                        )
                      }
                    >
                      Sao chép về nhà xe
                    </button>
                  ) : null}
                </>
              }
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function LayoutCard({
  layout,
  vehicles,
  actions,
}: {
  layout: SeatLayout;
  vehicles: Vehicle[];
  actions: ReactNode;
}) {
  const plates = layout.vehicleIds
    .map((id) => vehicles.find((v) => v.vehicleId === id)?.registrationPlate)
    .filter(Boolean);
  return (
    <li className="layout-card">
      <div className="partner-stage-title">
        <strong>{layout.name}</strong>
        {layout.organizationId ? <TransportStatus value={layout.status} /> : null}
      </div>
      <small>
        {layoutKindLabels[layout.layoutKind]} · {layout.deckCount} tầng · {layout.sellableCount}/
        {layout.seatCount} ghế bán
      </small>
      {plates.length ? <small>Đang gắn: {plates.join(', ')}</small> : null}
      <div className="partner-actions">{actions}</div>
    </li>
  );
}

function VehicleAttachments({
  vehicles,
  attached,
  layouts,
  canOperate,
  busy,
  onAttach,
}: {
  vehicles: Vehicle[];
  attached: VehicleSeatLayout[];
  layouts: SeatLayout[];
  canOperate: boolean;
  busy: boolean;
  onAttach: (vehicleId: string, layoutId: string) => Promise<boolean>;
}) {
  const [choice, setChoice] = useState<Record<string, string>>({});
  return (
    <section className="panel">
      <h2>Sơ đồ theo xe</h2>
      <p className="partner-meta">
        Mỗi xe gắn một sơ đồ. Sơ đồ đã gắn sẽ bị khóa; muốn sửa hãy sao chép thành sơ đồ mới rồi gắn
        lại. Số ghế bán không được vượt số chỗ trong hồ sơ xe.
      </p>
      {vehicles.length === 0 ? (
        <EmptyRecords title="Chưa có xe" description="Thêm phương tiện ở mục Phương tiện trước." />
      ) : (
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Sơ đồ theo xe">
          <table>
            <thead>
              <tr>
                <th scope="col">Biển số</th>
                <th scope="col">Số chỗ đăng ký</th>
                <th scope="col">Sơ đồ đang gắn</th>
                {canOperate ? <th scope="col">Gắn sơ đồ</th> : null}
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => {
                const current = attached.find((a) => a.vehicleId === vehicle.vehicleId);
                const selected = choice[vehicle.vehicleId] ?? '';
                return (
                  <tr key={vehicle.vehicleId}>
                    <td>{vehicle.registrationPlate}</td>
                    <td>{vehicle.seatCount ?? 'Chưa khai báo'}</td>
                    <td>
                      {current
                        ? current.layoutName + ' · ' + current.sellableCount + ' ghế bán'
                        : 'Chưa gắn'}
                    </td>
                    {canOperate ? (
                      <td>
                        <div className="inline-form">
                          <select
                            aria-label={'Sơ đồ cho xe ' + vehicle.registrationPlate}
                            value={selected}
                            onChange={(e) =>
                              setChoice({ ...choice, [vehicle.vehicleId]: e.target.value })
                            }
                          >
                            <option value="">Chọn sơ đồ…</option>
                            {layouts.map((layout) => (
                              <option
                                key={layout.id}
                                value={layout.id}
                                disabled={
                                  vehicle.seatCount !== null &&
                                  layout.sellableCount > vehicle.seatCount
                                }
                              >
                                {layout.name} ({layout.sellableCount} ghế bán)
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="button secondary"
                            disabled={busy || !selected || selected === current?.layoutId}
                            onClick={() => void onAttach(vehicle.vehicleId, selected)}
                          >
                            Gắn
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function LayoutEditor({
  initial,
  busy,
  error,
  onSave,
  onCancel,
}: {
  initial: Editing;
  busy: boolean;
  error: unknown;
  onSave: (grid: Grid) => Promise<void>;
  onCancel: () => void;
}) {
  const [grid, setGrid] = useState<Grid>(initial.grid);
  const [active, setActive] = useState<{ deckNo: number; row: number; col: number } | null>(null);
  const summary = seatSummary(grid);
  const problems = gridProblems(grid);
  const cell = active ? cellAt(grid, active.deckNo, active.row, active.col) : null;
  return (
    <section className="panel partner-form seat-editor">
      <h2>{initial.layout ? 'Sửa sơ đồ ' + initial.layout.name : 'Sơ đồ mới'}</h2>
      <div className="form-row">
        <label>
          Tên sơ đồ
          <input
            required
            maxLength={200}
            value={grid.name}
            onChange={(e) => setGrid({ ...grid, name: e.target.value })}
          />
        </label>
        <label>
          Loại xe
          <select
            value={grid.layoutKind}
            onChange={(e) => setGrid({ ...grid, layoutKind: e.target.value as LayoutKind })}
          >
            {Object.entries(layoutKindLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Số tầng
          <select
            value={grid.decks.length}
            onChange={(e) => setGrid(setDeckCount(grid, Number(e.target.value) as 1 | 2))}
          >
            <option value={1}>1 tầng</option>
            <option value={2}>2 tầng</option>
          </select>
        </label>
      </div>
      {grid.decks.map((deck) => (
        <div className="form-row compact" key={deck.deckNo}>
          <strong>Tầng {deck.deckNo}</strong>
          <label>
            Số hàng
            <input
              type="number"
              min={1}
              max={MAX_ROWS}
              value={deck.rows}
              onChange={(e) =>
                setGrid(resizeDeck(grid, deck.deckNo, Number(e.target.value), deck.columns))
              }
            />
          </label>
          <label>
            Số cột
            <input
              type="number"
              min={1}
              max={MAX_COLUMNS}
              value={deck.columns}
              onChange={(e) =>
                setGrid(resizeDeck(grid, deck.deckNo, deck.rows, Number(e.target.value)))
              }
            />
          </label>
        </div>
      ))}
      <p className="partner-meta">
        Bấm một ô để sửa. {summary.seats} ghế · {summary.sellable} ghế bán · {summary.vip} ghế VIP.
      </p>
      <div className="seat-editor-body">
        <SeatGrid grid={grid} mode="edit" active={active} onCell={(c) => setActive(c)} />
        {cell ? (
          <div className="seat-cell-form">
            <h3>
              Hàng {cell.row}, cột {cell.col}
              {grid.decks.length > 1 ? ' · tầng ' + cell.deckNo : ''}
            </h3>
            <label>
              Loại ô
              <select
                value={cell.cellType}
                onChange={(e) =>
                  setGrid(
                    updateCell(grid, {
                      ...cell,
                      cellType: e.target.value as (typeof cellCycle)[number],
                      isSellable: e.target.value === 'Seat',
                      label: e.target.value === 'Seat' ? cell.label : null,
                    }),
                  )
                }
              >
                {cellCycle.map((type) => (
                  <option key={type} value={type}>
                    {cellTypeLabels[type]}
                  </option>
                ))}
              </select>
            </label>
            {cell.cellType === 'Seat' ? (
              <>
                <label>
                  Mã ghế
                  <input
                    maxLength={10}
                    value={cell.label ?? ''}
                    onChange={(e) =>
                      setGrid(updateCell(grid, { ...cell, label: e.target.value.toUpperCase() }))
                    }
                  />
                </label>
                <label>
                  Hạng ghế
                  <select
                    value={cell.seatClass ?? 'Standard'}
                    onChange={(e) =>
                      setGrid(
                        updateCell(grid, {
                          ...cell,
                          seatClass: e.target.value as 'Standard' | 'Vip',
                        }),
                      )
                    }
                  >
                    <option value="Standard">Thường</option>
                    <option value="Vip">VIP</option>
                  </select>
                </label>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={cell.isSellable}
                    onChange={(e) =>
                      setGrid(updateCell(grid, { ...cell, isSellable: e.target.checked }))
                    }
                  />
                  Ghế được bán (bỏ chọn cho ghế phụ xe, ghế hỏng…)
                </label>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="partner-actions">
        <button type="button" className="button secondary" onClick={() => setGrid(autoLabel(grid))}>
          Đánh số lại tự động
        </button>
      </div>
      {problems.length ? (
        <div className="notice">
          <ul>
            {problems.slice(0, 8).map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {error ? <ErrorNotice error={error} /> : null}
      <div className="partner-actions">
        <button
          type="button"
          className="button primary"
          disabled={busy || problems.length > 0}
          onClick={() => void onSave(grid)}
        >
          {busy ? 'Đang lưu…' : 'Lưu sơ đồ'}
        </button>
        <button type="button" className="button secondary" onClick={onCancel}>
          Hủy
        </button>
      </div>
    </section>
  );
}
