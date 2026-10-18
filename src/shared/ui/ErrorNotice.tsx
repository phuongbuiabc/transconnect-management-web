import { ApiError, errorMessage } from '../../core/api/apiError';
export function ErrorNotice({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div className="notice error" role="alert">
      <strong>
        {error instanceof ApiError && error.status === 403
          ? 'Không đủ quyền truy cập'
          : 'Chưa thể hoàn tất yêu cầu'}
      </strong>
      <p>{errorMessage(error)}</p>
      {error instanceof ApiError && Object.keys(error.fields).length > 0 ? (
        <ul>
          {Object.entries(error.fields).flatMap(([field, messages]) =>
            messages.map((message, index) => <li key={field + index}>{message}</li>),
          )}
        </ul>
      ) : null}
      {retry ? (
        <button className="button secondary" onClick={retry}>
          Thử lại
        </button>
      ) : null}
    </div>
  );
}
