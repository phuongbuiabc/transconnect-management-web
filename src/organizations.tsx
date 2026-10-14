import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { request, type Organization } from './lib/api';
import { ErrorNotice, Loading, Status, statusLabels } from './ui';
export function OrganizationList() {
  const [items, setItems] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  useEffect(() => { const controller = new AbortController(); setLoading(true); setError(null);
    request<Organization[]>('/organizations', { signal: controller.signal }).then(value => { if (!controller.signal.aborted) setItems(value); }).catch(failure => { if (!controller.signal.aborted) setError(failure); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  const normalized = query.trim().toLocaleLowerCase('vi');
  const filtered = items.filter(item => (status === 'all' || item.reviewStatus === status) && [item.name, item.registrationNumber, item.ownerEmail].some(value => value.toLocaleLowerCase('vi').includes(normalized)));
  return <><div className="page-heading"><div><p className="eyebrow">QUẢN LÝ ĐỐI TÁC</p><h1>Đơn vị vận tải</h1><p>Kiểm tra hồ sơ và tiếp nhận đối tác vào hệ thống.</p></div><button className="button secondary" disabled={loading} onClick={() => setRevision(value => value + 1)}>↻ Làm mới</button></div>
    <section className="panel"><div className="panel-toolbar"><div><h2>Danh sách hồ sơ</h2><p>Hiển thị tối đa 200 hồ sơ do máy chủ trả về.</p></div><span className="count">{loading ? 'Đang tải' : items.length + ' hồ sơ đã tải'}</span></div>
    <div className="filters"><label className="search-label"><span className="sr-only">Tìm trong hồ sơ đã tải</span><input type="search" placeholder="Tìm tên, mã đăng ký, email…" value={query} onChange={event => setQuery(event.target.value)} /></label><label><span className="sr-only">Trạng thái hồ sơ</span><select value={status} onChange={event => setStatus(event.target.value)}><option value="all">Tất cả trạng thái</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    {loading ? <Loading /> : error ? <ErrorNotice error={error} retry={() => setRevision(value => value + 1)} /> : filtered.length === 0 ? <div className="state"><h3>{items.length ? 'Không có hồ sơ phù hợp' : 'Chưa có hồ sơ đăng ký'}</h3><p>{items.length ? 'Thử thay đổi từ khóa hoặc trạng thái.' : 'Hồ sơ đăng ký của đơn vị vận tải sẽ xuất hiện tại đây.'}</p></div> : <><div className="table-scroll"><table><thead><tr><th>Đơn vị vận tải</th><th>Email chủ sở hữu</th><th>Trạng thái</th><th><span className="sr-only">Thao tác</span></th></tr></thead><tbody>{filtered.map(item => <tr key={item.id}><td><Link className="organization-name" to={'/admin/organizations/' + item.id}>{item.name}</Link><small>Mã đăng ký: {item.registrationNumber}</small></td><td>{item.ownerEmail}</td><td><Status value={item.reviewStatus} /></td><td><Link className="text-link" to={'/admin/organizations/' + item.id}>Xem hồ sơ <span aria-hidden="true">→</span></Link></td></tr>)}</tbody></table></div><div className="table-footer">{filtered.length} kết quả trong {items.length} hồ sơ đã tải · Bộ lọc chỉ áp dụng trên dữ liệu này.</div></>}
    </section><aside className="info-strip"><span className="info-icon" aria-hidden="true">i</span><p><strong>Duyệt hồ sơ một lần.</strong> Hồ sơ chỉ có thể được duyệt hoặc từ chối khi đang chờ duyệt. Khi được duyệt, hệ thống gửi lời mời cho chủ sở hữu.</p></aside></>;
}
export function OrganizationDetail() {
  const { id } = useParams();
  const [item, setItem] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [revision, setRevision] = useState(0);
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [reviewError, setReviewError] = useState<unknown>(null);
  const [success, setSuccess] = useState('');
  const version = useRef(0);
  useEffect(() => { version.current++; return () => { version.current++; }; }, [id]);
  useEffect(() => { const controller = new AbortController(); setLoading(true); setSaving(false); setError(null); setItem(null); setDecision(null); setNote(''); setReviewError(null); setSuccess('');
    request<Organization>('/organizations/' + encodeURIComponent(id || ''), { signal: controller.signal }).then(value => { if (!controller.signal.aborted) setItem(value); }).catch(failure => { if (!controller.signal.aborted) setError(failure); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, revision]);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!item || !decision || !note.trim() || saving || item.reviewStatus !== 'Pending') return;
    const started = version.current;
    setSaving(true); setReviewError(null);
    try { const updated = await request<Organization>('/organizations/' + encodeURIComponent(item.id) + '/review', { method: 'POST', body: JSON.stringify({ approved: decision === 'approve', note: note.trim() }) }); if (version.current !== started) return; setItem(updated); setDecision(null); setNote(''); setSuccess(updated.reviewStatus === 'Approved' ? 'Đã duyệt hồ sơ. Hệ thống đã tiếp nhận gửi lời mời cho chủ sở hữu.' : 'Đã từ chối hồ sơ và lưu ghi chú xét duyệt.'); }
    catch (failure) { if (version.current === started) setReviewError(failure); } finally { if (version.current === started) setSaving(false); }
  }
  return <><Link className="back-link" to="/admin/organizations">← Danh sách đơn vị vận tải</Link>{loading ? <Loading /> : error ? <ErrorNotice error={error} retry={() => setRevision(value => value + 1)} /> : item ? <><div className="page-heading"><div><p className="eyebrow">HỒ SƠ ĐỐI TÁC</p><h1>{item.name}</h1><p className="reference">Mã hồ sơ: {item.id}</p></div><Status value={item.reviewStatus} /></div>{success ? <div className="notice success" role="status">{success}</div> : null}<div className="detail-grid"><section className="panel detail-panel"><h2>Thông tin đăng ký</h2><dl><div><dt>Tên đơn vị vận tải</dt><dd>{item.name}</dd></div><div><dt>Mã đăng ký kinh doanh</dt><dd>{item.registrationNumber}</dd></div><div><dt>Email chủ sở hữu</dt><dd><a href={'mailto:' + item.ownerEmail}>{item.ownerEmail}</a></dd></div><div><dt>Hạn mức nhân sự</dt><dd>{item.employeeLimit}</dd></div><div><dt>Hạn mức tài xế</dt><dd>{item.driverLimit === null ? 'Không giới hạn' : item.driverLimit}</dd></div></dl></section><section className="panel detail-panel review-panel"><p className="eyebrow">XÉT DUYỆT</p><h2>{item.reviewStatus === 'Pending' ? 'Đánh giá hồ sơ' : 'Kết quả xét duyệt'}</h2>{item.reviewStatus === 'Pending' ? <><p>Xác minh thông tin đăng ký trước khi đưa ra quyết định. Quyết định được lưu và không thể sửa từ màn hình này.</p>{!decision ? <div className="review-actions"><button className="button primary" onClick={() => { setDecision('approve'); setReviewError(null); }}>Duyệt hồ sơ</button><button className="button danger-outline" onClick={() => { setDecision('reject'); setReviewError(null); }}>Từ chối</button></div> : <form onSubmit={submit}><div className="decision-label">{decision === 'approve' ? 'Xác nhận duyệt hồ sơ' : 'Xác nhận từ chối hồ sơ'}</div><label htmlFor="review-note">Ghi chú xét duyệt <span aria-hidden="true">*</span></label><textarea autoFocus id="review-note" required maxLength={2000} rows={5} value={note} onChange={event => setNote(event.target.value)} disabled={saving} placeholder="Nhập kết quả xác minh hoặc lý do từ chối…" /><div className="field-hint">Bắt buộc · {note.length}/2000 ký tự</div>{reviewError ? <ErrorNotice error={reviewError} /> : null}<div className="review-actions"><button className={'button ' + (decision === 'approve' ? 'primary' : 'danger')} disabled={saving || !note.trim()}>{saving ? 'Đang lưu…' : 'Xác nhận ' + (decision === 'approve' ? 'duyệt' : 'từ chối')}</button><button className="button secondary" type="button" disabled={saving} onClick={() => { setDecision(null); setReviewError(null); }}>Hủy</button></div>{reviewError ? <button type="button" className="text-link reload-review" disabled={saving} onClick={() => setRevision(value => value + 1)}>Tải lại trạng thái hồ sơ</button> : null}</form>}</> : <><Status value={item.reviewStatus} /><h3>Ghi chú xét duyệt</h3><p className="review-note">{item.reviewNote || 'Không có ghi chú.'}</p><p className="field-hint">Hồ sơ đã có quyết định xét duyệt.</p></>}</section></div></> : null}</>;
}
