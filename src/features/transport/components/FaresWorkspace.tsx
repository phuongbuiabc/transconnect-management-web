import { useState } from 'react';
import { ErrorNotice, Loading } from '../../../shared/ui';
import { EmptyRecords } from '../../../shared/ui/RecordLayout';
import { transportApi } from '../api/transportApi';
import { useFareDetail, useRouteFares, useRoutes } from '../hooks/useTransport';
import {
  draftFromTable,
  fareProblems,
  farePairs,
  farePhaseLabels,
  fareToInput,
  isPriceable,
  matrixAxes,
  missingFirstToLast,
  pairKey,
  type FareDraft,
} from '../models/fareMatrix';
import { vietnamToday } from '../models/scheduleRules';
import { formatVnd, type FareTable } from '../models/transport';
import { TransportStatus } from './TransportStatus';
import '../transport.css';

/** Bảng giá theo chặng (Q-M2-FARE): chỉ Owner lập/sửa/công bố (007C); thành viên khác chỉ xem. */
export function FaresWorkspace({
  organizationId,
  canOperate,
  isOwner,
}: {
  organizationId: string;
  canOperate: boolean;
  isOwner: boolean;
}) {
  const state = useRoutes(organizationId);
  const [selected, setSelected] = useState<string | null>(null);
  const canEdit = canOperate && isOwner;
  if (selected)
    return (
      <RouteFares
        key={selected}
        organizationId={organizationId}
        routeId={selected}
        canEdit={canEdit}
        onBack={() => setSelected(null)}
      />
    );
  if (state.loading) return <Loading />;
  if (!state.data) return <ErrorNotice error={state.error} retry={state.reload} />;
  const routes = state.data.filter((r) => r.currentRevisionId);
  return (
    <div className="partner-list">
      {!isOwner ? (
        <p className="notice">Chỉ Owner của tổ chức được lập, sửa và công bố bảng giá.</p>
      ) : null}
      {routes.length === 0 ? (
        <EmptyRecords
          title="Chưa có tuyến đã công bố"
          description="Công bố tuyến ở mục Tuyến trước, sau đó lập bảng giá cho từng chặng."
        />
      ) : (
        routes.map((route) => (
          <article key={route.id} className="panel partner-record">
            <div className="partner-stage-title">
              <h2>
                {route.code} · {route.name}
              </h2>
              <TransportStatus value={route.status} />
            </div>
            <p className="partner-meta">
              {route.firstStopName} → {route.lastStopName} · bản {route.currentRevisionNo}
            </p>
            <div className="partner-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setSelected(route.id)}
              >
                Xem bảng giá
              </button>
            </div>
          </article>
        ))
      )}
    </div>
  );
}

function RouteFares({
  organizationId,
  routeId,
  canEdit,
  onBack,
}: {
  organizationId: string;
  routeId: string;
  canEdit: boolean;
  onBack: () => void;
}) {
  const state = useRouteFares(organizationId, routeId);
  const [opened, setOpened] = useState<string | null>(null);
  if (opened)
    return (
      <FareEditor
        key={opened}
        organizationId={organizationId}
        routeId={routeId}
        fareId={opened}
        canEdit={canEdit}
        onBack={() => {
          setOpened(null);
          state.reload();
        }}
      />
    );
  if (state.loading) return <Loading />;
  if (!state.data) return <ErrorNotice error={state.error} retry={state.reload} />;
  const { detail, fares } = state.data;
  const revisions = detail.revisions.filter((r) => r.status !== 'Draft');
  return (
    <div className="partner-list">
      <div className="partner-actions">
        <button type="button" className="button secondary" onClick={onBack}>
          ← Danh sách tuyến
        </button>
      </div>
      <h2>
        {detail.route.code} · {detail.route.name}
      </h2>
      {state.error ? <ErrorNotice error={state.error} /> : null}
      {revisions.map((revision) => {
        const tables = fares.filter((f) => f.routeRevisionId === revision.id);
        const hasDraft = tables.some((f) => f.status === 'Draft');
        return (
          <article key={revision.id} className="panel partner-record">
            <div className="partner-stage-title">
              <h3>
                Bản tuyến {revision.revisionNo} · {revision.stopCount} điểm
              </h3>
              <TransportStatus value={revision.status} />
            </div>
            {tables.length === 0 ? (
              <p className="partner-meta">
                Chưa có bảng giá. Lịch "Đặt ngay" hoặc "Khách gửi yêu cầu" dùng bản tuyến này chưa
                kích hoạt được.
              </p>
            ) : (
              <ul className="fare-tables">
                {tables.map((table) => (
                  <li key={table.id}>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => setOpened(table.id)}
                    >
                      Bảng giá số {table.tableNo}
                    </button>{' '}
                    <TransportStatus
                      value={table.status === 'Superseded' ? 'Retired' : table.status}
                      label={
                        table.status === 'Superseded'
                          ? 'Bị thay trước khi áp dụng'
                          : table.phase
                            ? farePhaseLabels[table.phase]
                            : undefined
                      }
                    />{' '}
                    <span className="partner-meta">
                      áp dụng từ {formatDate(table.effectiveFrom)} · {table.priceCount}/
                      {table.pairCount} chặng có giá
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {canEdit && !hasDraft ? (
              <div className="partner-actions">
                <button
                  type="button"
                  className="button primary"
                  disabled={state.busy}
                  onClick={() =>
                    void state.mutate(async () => {
                      const created = await transportApi.createFare(
                        organizationId,
                        routeId,
                        revision.id,
                      );
                      setOpened(created.id);
                    })
                  }
                >
                  {tables.length ? 'Lập bảng giá mới (chép giá bảng gần nhất)' : 'Lập bảng giá'}
                </button>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function FareEditor({
  organizationId,
  routeId,
  fareId,
  canEdit,
  onBack,
}: {
  organizationId: string;
  routeId: string;
  fareId: string;
  canEdit: boolean;
  onBack: () => void;
}) {
  const state = useFareDetail(organizationId, routeId, fareId);
  if (state.loading) return <Loading />;
  if (!state.data) return <ErrorNotice error={state.error} retry={state.reload} />;
  const table = state.data;
  return (
    <FareForm
      key={table.version}
      table={table}
      editable={canEdit && table.status === 'Draft'}
      busy={state.busy}
      error={state.error}
      onBack={onBack}
      onSave={(draft, publish) =>
        state.mutate(async () => {
          const saved = await transportApi.saveFare(
            organizationId,
            table,
            fareToInput(draft, table.stops ?? []),
          );
          if (publish) await transportApi.publishFare(organizationId, saved);
        })
      }
      onDelete={() =>
        state.mutate(async () => {
          await transportApi.deleteFare(organizationId, table);
          onBack();
        })
      }
    />
  );
}

function FareForm({
  table,
  editable,
  busy,
  error,
  onBack,
  onSave,
  onDelete,
}: {
  table: FareTable;
  editable: boolean;
  busy: boolean;
  error: unknown;
  onBack: () => void;
  onSave: (draft: FareDraft, publish: boolean) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<FareDraft>(() => draftFromTable(table));
  const [vipMode, setVipMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const stops = table.stops ?? [];
  const { rows, columns } = matrixAxes(stops);
  const problems = editable ? fareProblems(draft, stops) : [];
  const missing = missingFirstToLast(draft, stops);
  const priced = farePairs(stops).filter((p) =>
    draft.cells[pairKey(p.from.sharedLocationId, p.to.sharedLocationId)]?.price.trim(),
  ).length;
  const prices = new Map(
    (table.prices ?? []).map((p) => [pairKey(p.fromLocationId, p.toLocationId), p]),
  );
  const tooEarly = draft.effectiveFrom < vietnamToday();

  function setCell(key: string, value: string) {
    setDraft((d) => {
      const cell = d.cells[key] ?? { price: '', vipPrice: '' };
      return {
        ...d,
        cells: {
          ...d.cells,
          [key]: vipMode ? { ...cell, vipPrice: value } : { ...cell, price: value },
        },
      };
    });
  }

  return (
    <div className="partner-list">
      <div className="partner-actions">
        <button type="button" className="button secondary" onClick={onBack}>
          ← Các bảng giá của tuyến
        </button>
      </div>
      <article className="panel partner-form fare-editor">
        <div className="partner-stage-title">
          <h2>
            Bảng giá số {table.tableNo} · bản tuyến {table.revisionNo}
          </h2>
          <TransportStatus
            value={table.status === 'Superseded' ? 'Retired' : table.status}
            label={table.phase ? farePhaseLabels[table.phase] : undefined}
          />
        </div>
        {error ? <ErrorNotice error={error} /> : null}
        <div className="form-row compact">
          <label>
            Áp dụng từ ngày
            <input
              type="date"
              disabled={!editable}
              min={vietnamToday()}
              value={draft.effectiveFrom}
              onChange={(e) => setDraft({ ...draft, effectiveFrom: e.target.value })}
            />
          </label>
          <label>
            Phụ thu ghế Vip (nghìn đồng)
            <input
              inputMode="numeric"
              disabled={!editable}
              value={draft.vipSurcharge}
              onChange={(e) => setDraft({ ...draft, vipSurcharge: e.target.value })}
            />
          </label>
        </div>
        <label>
          Ghi chú (không bắt buộc)
          <input
            maxLength={1000}
            disabled={!editable}
            value={draft.note}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
          />
        </label>
        <p className="partner-meta">
          Hàng là điểm đón, cột là điểm trả. Giá nhập theo <strong>nghìn đồng</strong> (250 =
          250.000 đ). Ô để trống thì chặng đó không bán qua VieGo. Đã có giá {priced}/
          {farePairs(stops).length} chặng.
        </p>
        <div className="partner-actions">
          <button
            type="button"
            className={'button ' + (vipMode ? 'secondary' : 'primary')}
            aria-pressed={!vipMode}
            onClick={() => setVipMode(false)}
          >
            Giá ghế thường
          </button>
          <button
            type="button"
            className={'button ' + (vipMode ? 'primary' : 'secondary')}
            aria-pressed={vipMode}
            onClick={() => setVipMode(true)}
          >
            Giá ghế Vip
          </button>
        </div>
        {vipMode ? (
          <p className="partner-meta">
            Ô Vip để trống = giá thường + phụ thu {draft.vipSurcharge || 0} nghìn đồng. Nhập số để
            ghi đè riêng chặng đó.
          </p>
        ) : null}
        <div className="fare-matrix-wrap">
          <table className="fare-matrix">
            <thead>
              <tr>
                <th scope="col">Đón \ Trả</th>
                {columns.map((c) => (
                  <th key={c.sharedLocationId} scope="col">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.sharedLocationId}>
                  <th scope="row">{r.name}</th>
                  {columns.map((c) => {
                    if (c.sequence <= r.sequence)
                      return (
                        <td key={c.sharedLocationId} className="fare-void" aria-hidden="true" />
                      );
                    if (!isPriceable(r, c))
                      return (
                        <td
                          key={c.sharedLocationId}
                          className="fare-off"
                          title="Không đón/trả theo chiều này"
                        >
                          —
                        </td>
                      );
                    const key = pairKey(r.sharedLocationId, c.sharedLocationId);
                    const cell = draft.cells[key] ?? { price: '', vipPrice: '' };
                    const value = vipMode ? cell.vipPrice : cell.price;
                    if (!editable) {
                      const saved = prices.get(key);
                      return (
                        <td key={c.sharedLocationId}>
                          {saved ? formatVnd(vipMode ? saved.vipTotal : saved.price) : '—'}
                        </td>
                      );
                    }
                    return (
                      <td key={c.sharedLocationId}>
                        <input
                          inputMode="numeric"
                          aria-label={`${vipMode ? 'Giá Vip' : 'Giá'} ${r.name} đến ${c.name}, nghìn đồng`}
                          placeholder={vipMode && cell.price ? 'tự tính' : ''}
                          value={value}
                          onChange={(e) => setCell(key, e.target.value)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {table.warnings?.length ? (
          <div className="notice">
            <strong>Cảnh báo (vẫn công bố được):</strong>
            <ul>
              {table.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {problems.length ? (
          <ul className="notice error">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        ) : null}
        {editable ? (
          <>
            {missing ? (
              <p className="notice">Cần giá từ điểm đầu đến điểm cuối trước khi công bố.</p>
            ) : null}
            {tooEarly ? <p className="notice">Ngày áp dụng không được trước hôm nay.</p> : null}
            <p className="partner-meta">
              Công bố xong không sửa được. Bảng mới có ngày áp dụng sớm hơn hoặc bằng sẽ thay các
              bảng chưa đến ngày áp dụng; vé đã đặt giữ giá lúc đặt.
            </p>
            <div className="partner-actions">
              <button
                type="button"
                className="button secondary"
                disabled={busy || problems.length > 0}
                onClick={() => void onSave(draft, false)}
              >
                {busy ? 'Đang lưu…' : 'Lưu nháp'}
              </button>
              <button
                type="button"
                className="button primary"
                disabled={busy || problems.length > 0 || missing || tooEarly}
                onClick={() => void onSave(draft, true)}
              >
                Lưu và công bố
              </button>
              {confirmDelete ? (
                <>
                  <button
                    type="button"
                    className="button danger"
                    disabled={busy}
                    onClick={() => void onDelete()}
                  >
                    Xác nhận xóa nháp
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Hủy
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setConfirmDelete(true)}
                >
                  Xóa nháp
                </button>
              )}
            </div>
          </>
        ) : null}
      </article>
    </div>
  );
}

function formatDate(value: string) {
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}
