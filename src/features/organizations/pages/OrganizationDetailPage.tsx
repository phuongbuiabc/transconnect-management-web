import { Link, useParams } from 'react-router-dom';
import { ErrorNotice, Loading } from '../../../shared/ui';
import { Status } from '../components/OrganizationStatus';
import { useOrganization } from '../hooks/useOrganization';
import { ReviewHistory } from '../../foundation/components/ReviewHistory';
import { AdminVehicleLink } from '../../foundation/components/AdminVehicleLink';
import { LegacyApplication } from '../components/LegacyApplication';
export function OrganizationDetail() {
  const { id } = useParams();
  const {
    item,
    loading,
    error,
    decision,
    setDecision,
    note,
    setNote,
    saving,
    reviewError,
    setReviewError,
    success,
    submit,
    reload,
  } = useOrganization(id);
  return (
    <>
      <Link className="back-link" to="/admin/organizations">
        ← Danh sách đơn vị vận tải
      </Link>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNotice error={error} retry={reload} />
      ) : item ? (
        <>
          <div className="page-heading">
            <div>
              <p className="eyebrow">HỒ SƠ ĐỐI TÁC</p>
              <h1>{item.name}</h1>
              <p className="reference">Mã hồ sơ: {item.id}</p>
            </div>
            <Status value={item.reviewStatus} />
          </div>
          {success ? (
            <div className="notice success" role="status">
              {success}
            </div>
          ) : null}
          <div className="detail-grid">
            {!item.createdByUserId ? (
              <LegacyApplication key={item.reviewStatus} organization={item} reload={reload} />
            ) : null}
            {item.reviewStatus === 'Approved' ? <AdminVehicleLink id={item.id} /> : null}
            <ReviewHistory key={item.reviewStatus} type="organizations" id={item.id} />
            <section className="panel detail-panel">
              <h2>Thông tin đăng ký</h2>
              <dl>
                <div>
                  <dt>Tên đơn vị vận tải</dt>
                  <dd>{item.name}</dd>
                </div>
                <div>
                  <dt>Mã đăng ký kinh doanh</dt>
                  <dd>{item.registrationNumber}</dd>
                </div>
                <div>
                  <dt>Email chủ sở hữu</dt>
                  <dd>
                    <a href={'mailto:' + item.ownerEmail}>{item.ownerEmail}</a>
                  </dd>
                </div>
                <div>
                  <dt>Hạn mức nhân sự</dt>
                  <dd>{item.employeeLimit}</dd>
                </div>
                <div>
                  <dt>Hạn mức tài xế</dt>
                  <dd>{item.driverLimit === null ? 'Không giới hạn' : item.driverLimit}</dd>
                </div>
              </dl>
            </section>
            <section className="panel detail-panel review-panel">
              <p className="eyebrow">XÉT DUYỆT</p>
              <h2>{item.reviewStatus === 'Pending' ? 'Đánh giá hồ sơ' : 'Kết quả xét duyệt'}</h2>
              {item.reviewStatus === 'Pending' ? (
                <>
                  <p>
                    Xác minh thông tin đăng ký trước khi đưa ra quyết định. Quyết định được lưu và
                    không thể sửa từ màn hình này.
                  </p>
                  {!decision ? (
                    <div className="review-actions">
                      <button
                        className="button primary"
                        onClick={() => {
                          setDecision('approve');
                          setReviewError(null);
                        }}
                      >
                        Duyệt hồ sơ
                      </button>
                      <button
                        className="button danger-outline"
                        onClick={() => {
                          setDecision('reject');
                          setReviewError(null);
                        }}
                      >
                        Từ chối
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={submit}>
                      <div className="decision-label">
                        {decision === 'approve' ? 'Xác nhận duyệt hồ sơ' : 'Xác nhận từ chối hồ sơ'}
                      </div>
                      <label htmlFor="review-note">
                        Ghi chú xét duyệt <span aria-hidden="true">*</span>
                      </label>
                      <textarea
                        autoFocus
                        id="review-note"
                        required
                        maxLength={2000}
                        rows={5}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        disabled={saving}
                        placeholder="Nhập kết quả xác minh hoặc lý do từ chối…"
                      />
                      <div className="field-hint">Bắt buộc · {note.length}/2000 ký tự</div>
                      {reviewError ? <ErrorNotice error={reviewError} /> : null}
                      <div className="review-actions">
                        <button
                          className={'button ' + (decision === 'approve' ? 'primary' : 'danger')}
                          disabled={saving || !note.trim()}
                        >
                          {saving
                            ? 'Đang lưu…'
                            : 'Xác nhận ' + (decision === 'approve' ? 'duyệt' : 'từ chối')}
                        </button>
                        <button
                          className="button secondary"
                          type="button"
                          disabled={saving}
                          onClick={() => {
                            setDecision(null);
                            setReviewError(null);
                          }}
                        >
                          Hủy
                        </button>
                      </div>
                      {reviewError ? (
                        <button
                          type="button"
                          className="text-link reload-review"
                          disabled={saving}
                          onClick={reload}
                        >
                          Tải lại trạng thái hồ sơ
                        </button>
                      ) : null}
                    </form>
                  )}
                </>
              ) : (
                <>
                  <Status value={item.reviewStatus} />
                  <h3>Ghi chú xét duyệt</h3>
                  <p className="review-note">{item.reviewNote || 'Không có ghi chú.'}</p>
                  <p className="field-hint">Hồ sơ đã có quyết định xét duyệt.</p>
                </>
              )}
            </section>
          </div>
        </>
      ) : null}
    </>
  );
}
