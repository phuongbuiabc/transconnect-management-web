import { useState } from 'react';
import { ErrorNotice, Loading } from '../../../shared/ui';
import { EmptyRecords } from '../../../shared/ui/RecordLayout';
import { transportApi } from '../api/transportApi';
import { useRouteDetail, useRoutes, useSharedLocationSearch } from '../hooks/useTransport';
import { publishProblems, stopsToInput } from '../models/scheduleRules';
import { formatOffset, type Revision, type RouteDetail, type StopInput } from '../models/transport';
import { TransportStatus } from './TransportStatus';
import '../transport.css';

/** Tuyến cố định: nhà xe tự tạo, soạn bản nháp điểm dừng và tự công bố (Q-M2-SERVICE-004A). */
export function RoutesWorkspace({
  organizationId,
  canOperate,
}: {
  organizationId: string;
  canOperate: boolean;
}) {
  const state = useRoutes(organizationId);
  const [selected, setSelected] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  if (selected)
    return (
      <RouteEditor
        key={selected}
        organizationId={organizationId}
        routeId={selected}
        canOperate={canOperate}
        onBack={() => {
          setSelected(null);
          state.reload();
        }}
      />
    );
  return (
    <div className="partner-list">
      {canOperate ? (
        <form
          className="panel partner-form"
          onSubmit={(e) => {
            e.preventDefault();
            void state
              .mutate(async () => {
                const created = await transportApi.createRoute(
                  organizationId,
                  code.trim(),
                  name.trim(),
                );
                setSelected(created.route.id);
              })
              .then((ok) => {
                if (ok) {
                  setCode('');
                  setName('');
                }
              });
          }}
        >
          <h2>Tạo tuyến mới</h2>
          <div className="form-row">
            <label>
              Mã tuyến
              <input
                required
                maxLength={50}
                pattern="[A-Za-z0-9][A-Za-z0-9_.\-]*"
                title="Chữ, số và các ký tự - _ ."
                placeholder="HN-HP-01"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
            <label>
              Tên tuyến
              <input
                required
                maxLength={255}
                placeholder="Hà Nội – Hải Phòng"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          </div>
          <div className="partner-actions">
            <button className="button primary" disabled={state.busy}>
              Tạo tuyến
            </button>
          </div>
        </form>
      ) : (
        <p className="notice">
          Dịch vụ xe khách chưa được duyệt hoặc đang tạm ngưng nên chỉ xem được tuyến.
        </p>
      )}
      {state.error ? <ErrorNotice error={state.error} retry={state.reload} /> : null}
      {state.loading ? (
        <Loading />
      ) : !state.data?.length ? (
        <EmptyRecords title="Chưa có tuyến" description="Tạo tuyến đầu tiên của nhà xe." />
      ) : (
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Danh sách tuyến">
          <table>
            <thead>
              <tr>
                <th scope="col">Tuyến</th>
                <th scope="col">Hành trình</th>
                <th scope="col">Bản công bố</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {state.data.map((route) => (
                <tr key={route.id}>
                  <td>
                    <strong>{route.code}</strong>
                    <br />
                    <small>{route.name}</small>
                  </td>
                  <td>
                    {route.firstStopName
                      ? route.firstStopName + ' → ' + route.lastStopName
                      : 'Chưa công bố'}
                  </td>
                  <td>
                    {route.currentRevisionNo ? 'Bản ' + route.currentRevisionNo : '—'}
                    {route.hasDraft ? <small> · có bản nháp</small> : null}
                  </td>
                  <td>
                    <TransportStatus value={route.status} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => setSelected(route.id)}
                    >
                      Mở
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RouteEditor({
  organizationId,
  routeId,
  canOperate,
  onBack,
}: {
  organizationId: string;
  routeId: string;
  canOperate: boolean;
  onBack: () => void;
}) {
  const state = useRouteDetail(organizationId, routeId);
  const detail = state.data;
  return (
    <div className="partner-list">
      <button type="button" className="button secondary back-button" onClick={onBack}>
        ← Danh sách tuyến
      </button>
      {state.error ? <ErrorNotice error={state.error} retry={state.reload} /> : null}
      {state.loading || !detail ? (
        state.loading ? (
          <Loading />
        ) : null
      ) : (
        <>
          <RouteHeader
            key={detail.route.version}
            detail={detail}
            organizationId={organizationId}
            canOperate={canOperate}
            busy={state.busy}
            mutate={state.mutate}
          />
          {detail.draft ? (
            <DraftEditor
              key={detail.draft.id + ':' + detail.draft.version}
              organizationId={organizationId}
              detail={detail}
              draft={detail.draft}
              canOperate={canOperate && detail.route.status === 'Active'}
              busy={state.busy}
              mutate={state.mutate}
              onRouteDeleted={onBack}
            />
          ) : canOperate && detail.route.status === 'Active' ? (
            <button
              type="button"
              className="button primary"
              disabled={state.busy}
              onClick={() =>
                void state.mutate(() => transportApi.createDraft(organizationId, routeId))
              }
            >
              {detail.current ? 'Tạo bản sửa đổi từ bản đang công bố' : 'Tạo bản nháp điểm dừng'}
            </button>
          ) : null}
          {detail.current ? <StopList title="Bản đang công bố" revision={detail.current} /> : null}
          {detail.revisions.filter((r) => r.status === 'Retired').length ? (
            <details className="panel">
              <summary>Các bản đã thay thế</summary>
              <ul>
                {detail.revisions
                  .filter((r) => r.status === 'Retired')
                  .map((r) => (
                    <li key={r.id}>
                      Bản {r.revisionNo} · {r.stopCount} điểm ·{' '}
                      {r.publishedAt ? new Date(r.publishedAt).toLocaleString('vi-VN') : ''}
                    </li>
                  ))}
              </ul>
            </details>
          ) : null}
        </>
      )}
    </div>
  );
}

type Mutate = (action: () => Promise<unknown>) => Promise<boolean>;

function RouteHeader({
  detail,
  organizationId,
  canOperate,
  busy,
  mutate,
}: {
  detail: RouteDetail;
  organizationId: string;
  canOperate: boolean;
  busy: boolean;
  mutate: Mutate;
}) {
  const route = detail.route;
  const [code, setCode] = useState(route.code);
  const [name, setName] = useState(route.name);
  const [reason, setReason] = useState('');
  const [toggling, setToggling] = useState(false);
  const active = route.status === 'Active';
  return (
    <section className="panel partner-record">
      <div className="partner-stage-title">
        <h2>
          {route.code} · {route.name}
        </h2>
        <TransportStatus value={route.status} />
      </div>
      {route.statusReason ? <p className="partner-meta">Lý do: {route.statusReason}</p> : null}
      {canOperate ? (
        <form
          className="form-row"
          onSubmit={(e) => {
            e.preventDefault();
            void mutate(() =>
              transportApi.updateRoute(organizationId, route, code.trim(), name.trim()),
            );
          }}
        >
          <label>
            Mã tuyến
            <input required maxLength={50} value={code} onChange={(e) => setCode(e.target.value)} />
          </label>
          <label>
            Tên tuyến
            <input
              required
              maxLength={255}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button
            className="button secondary"
            disabled={busy || (code === route.code && name === route.name)}
          >
            Lưu tên
          </button>
        </form>
      ) : null}
      {canOperate && !toggling ? (
        <div className="partner-actions">
          <button
            type="button"
            className={'button ' + (active ? 'danger-outline' : 'secondary')}
            onClick={() => setToggling(true)}
          >
            {active ? 'Ngừng hoạt động tuyến' : 'Kích hoạt lại tuyến'}
          </button>
        </div>
      ) : null}
      {toggling ? (
        <form
          className="partner-form"
          onSubmit={(e) => {
            e.preventDefault();
            void mutate(() =>
              transportApi.setRouteActive(organizationId, route, !active, reason.trim()),
            );
          }}
        >
          <label>
            {active ? 'Lý do ngừng (không bắt buộc)' : 'Ghi chú (không bắt buộc)'}
            <input maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          {active ? (
            <p className="notice">
              Ngừng tuyến sẽ tạm dừng các lịch chạy đang hoạt động của tuyến.
            </p>
          ) : null}
          <div className="partner-actions">
            <button className={'button ' + (active ? 'danger' : 'primary')} disabled={busy}>
              Xác nhận
            </button>
            <button type="button" className="button secondary" onClick={() => setToggling(false)}>
              Hủy
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function StopList({ title, revision }: { title: string; revision: Revision }) {
  return (
    <section className="panel">
      <h3>
        {title} · bản {revision.revisionNo}
      </h3>
      <ol className="route-stops">
        {(revision.stops ?? []).map((stop) => (
          <li key={stop.id}>
            <strong>{stop.name}</strong> · {stop.addressDetail}
            <br />
            <small>
              {stop.sequence === 1 ? 'Khởi hành' : '+' + formatOffset(stop.offsetMinutes)} ·{' '}
              {[stop.allowPickup ? 'Đón' : '', stop.allowDropoff ? 'Trả' : '']
                .filter(Boolean)
                .join(' / ')}
              {stop.dwellMinutes ? ' · dừng ' + stop.dwellMinutes + ' phút' : ''}
            </small>
          </li>
        ))}
      </ol>
    </section>
  );
}

function DraftEditor({
  organizationId,
  detail,
  draft,
  canOperate,
  busy,
  mutate,
  onRouteDeleted,
}: {
  organizationId: string;
  detail: RouteDetail;
  draft: Revision;
  canOperate: boolean;
  busy: boolean;
  mutate: Mutate;
  onRouteDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const saved = stopsToInput(draft.stops);
  const [stops, setStops] = useState<StopInput[]>(saved);
  const [note, setNote] = useState(draft.note ?? '');
  const [query, setQuery] = useState('');
  const search = useSharedLocationSearch(query);
  const dirty = JSON.stringify(saved) !== JSON.stringify(stops) || (draft.note ?? '') !== note;
  const problems = publishProblems(stops);
  const routeId = detail.route.id;
  function patch(index: number, change: Partial<StopInput>) {
    setStops(stops.map((stop, i) => (i === index ? { ...stop, ...change } : stop)));
  }
  function move(index: number, delta: number) {
    const next = [...stops];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    setStops(next);
  }
  return (
    <section className="panel partner-form">
      <div className="partner-stage-title">
        <h3>Bản nháp {draft.revisionNo}</h3>
        <TransportStatus value="Draft" />
      </div>
      <p className="partner-meta">
        Điểm dừng chọn từ địa điểm dùng chung đã được VieGo duyệt. Thời gian tính từ lúc xe rời điểm
        đầu. Bản nháp không ảnh hưởng lịch đang chạy cho tới khi công bố.
      </p>
      <ol className="route-stops editable">
        {stops.map((stop, index) => (
          <li key={stop.sharedLocationId}>
            <div>
              <strong>{stop.name}</strong>
              <small> · {stop.addressDetail}</small>
            </div>
            <div className="form-row compact">
              <label>
                Phút từ điểm đầu
                <input
                  type="number"
                  min={0}
                  max={10080}
                  disabled={!canOperate}
                  value={stop.offsetMinutes}
                  onChange={(e) => patch(index, { offsetMinutes: Number(e.target.value) })}
                />
              </label>
              <label>
                Dừng (phút)
                <input
                  type="number"
                  min={0}
                  max={600}
                  disabled={!canOperate}
                  value={stop.dwellMinutes ?? ''}
                  onChange={(e) =>
                    patch(index, {
                      dwellMinutes: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  disabled={!canOperate}
                  checked={stop.allowPickup}
                  onChange={(e) => patch(index, { allowPickup: e.target.checked })}
                />
                Đón
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  disabled={!canOperate}
                  checked={stop.allowDropoff}
                  onChange={(e) => patch(index, { allowDropoff: e.target.checked })}
                />
                Trả
              </label>
            </div>
            {canOperate ? (
              <div className="partner-actions">
                <button
                  type="button"
                  className="button secondary"
                  aria-label={'Đưa ' + stop.name + ' lên'}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="button secondary"
                  aria-label={'Đưa ' + stop.name + ' xuống'}
                  disabled={index === stops.length - 1}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="button danger-outline"
                  onClick={() => setStops(stops.filter((_, i) => i !== index))}
                >
                  Bỏ điểm
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
      {canOperate ? (
        <>
          <label>
            Thêm điểm dừng
            <input
              type="search"
              placeholder="Gõ ít nhất 2 ký tự tên bến, văn phòng…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          {search.error ? <ErrorNotice error={search.error} /> : null}
          {search.loading ? <small>Đang tìm…</small> : null}
          {search.items.length ? (
            <ul className="location-results">
              {search.items.map((location) => {
                const used = stops.some((s) => s.sharedLocationId === location.id);
                return (
                  <li key={location.id}>
                    <button
                      type="button"
                      className="button secondary"
                      disabled={used}
                      onClick={() => {
                        const last = stops[stops.length - 1];
                        setStops([
                          ...stops,
                          {
                            sharedLocationId: location.id,
                            name: location.name,
                            addressDetail: location.addressDetail,
                            allowPickup: true,
                            allowDropoff: stops.length > 0,
                            offsetMinutes: last ? last.offsetMinutes + 30 : 0,
                            dwellMinutes: null,
                          },
                        ]);
                        setQuery('');
                      }}
                    >
                      {used ? 'Đã có' : 'Thêm'}
                    </button>{' '}
                    <strong>{location.name}</strong> · {location.addressDetail}
                  </li>
                );
              })}
            </ul>
          ) : query.trim().length >= 2 && !search.loading ? (
            <small>
              Không thấy điểm phù hợp. Owner có thể đề xuất địa điểm mới ở mục Địa điểm.
            </small>
          ) : null}
          <label>
            Ghi chú thay đổi
            <input maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          {problems.length ? (
            <div className="notice">
              <strong>Chưa đủ điều kiện công bố:</strong>
              <ul>
                {problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="partner-actions">
            <button
              type="button"
              className="button secondary"
              disabled={busy || !dirty}
              onClick={() =>
                void mutate(() =>
                  transportApi.saveDraft(
                    organizationId,
                    routeId,
                    draft.id,
                    draft.version,
                    stops,
                    note,
                  ),
                )
              }
            >
              Lưu bản nháp
            </button>
            <button
              type="button"
              className="button primary"
              disabled={busy || dirty || problems.length > 0}
              title={dirty ? 'Lưu bản nháp trước khi công bố' : undefined}
              onClick={() =>
                void mutate(() =>
                  transportApi.publish(organizationId, routeId, draft.id, draft.version),
                )
              }
            >
              Công bố bản {draft.revisionNo}
            </button>
            {deleting ? (
              <>
                <button
                  type="button"
                  className="button danger"
                  disabled={busy}
                  onClick={() => {
                    // Tuyến chưa từng công bố bị xóa cùng bản nháp: về danh sách thay vì tải lại.
                    if (!detail.current)
                      void transportApi
                        .deleteDraft(organizationId, routeId, draft.id)
                        .then(onRouteDeleted, (failure) => mutate(() => Promise.reject(failure)));
                    else
                      void mutate(() =>
                        transportApi.deleteDraft(organizationId, routeId, draft.id),
                      );
                  }}
                >
                  {detail.current ? 'Xác nhận xóa bản nháp' : 'Xác nhận xóa tuyến chưa công bố'}
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setDeleting(false)}
                >
                  Giữ lại
                </button>
              </>
            ) : (
              <button
                type="button"
                className="button danger-outline"
                disabled={busy}
                onClick={() => setDeleting(true)}
              >
                Xóa bản nháp
              </button>
            )}
          </div>
          {dirty ? <small>Có thay đổi chưa lưu.</small> : null}
        </>
      ) : null}
    </section>
  );
}
