import { useCallback, useState } from 'react';
import { foundationApi } from '../api/foundationApi';
import { useFoundation } from '../hooks/useFoundation';
import { ErrorNotice, Loading } from '../../../shared/ui';
export function ProfileDocuments({
  type,
  id,
  readOnly = false,
}: {
  type: 'Driver' | 'Vehicle';
  id: string;
  readOnly?: boolean;
}) {
  const documentType = type === 'Driver' ? 'DriverLicense' : 'VehicleRegistration';
  const load = useCallback(
    (signal: AbortSignal) => foundationApi.documents(type, id, documentType, signal),
    [type, id, documentType],
  );
  const state = useFoundation(load);
  const [file, setFile] = useState<File>();
  const [confirmed, setConfirmed] = useState(false);
  async function download(fileId: string) {
    const blob = await foundationApi.downloadDocument(fileId);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'giay-to-demo.bin';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="panel">
      <h3>{type === 'Driver' ? 'GPLX giả lập' : 'Đăng ký xe giả lập'}</h3>
      <p>
        Chỉ dùng dữ liệu giả để demo. Quét/OCR và duyệt là mô phỏng, chưa xác minh giấy tờ thật.
      </p>
      {!readOnly ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (file && confirmed)
              void state.mutate(() => foundationApi.uploadDocument(type, id, documentType, file));
          }}
        >
          <label>
            Tệp giả lập
            <input
              type="file"
              required
              accept="image/jpeg,image/png,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0])}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            Tôi xác nhận tệp chỉ chứa dữ liệu giả.
          </label>
          <button className="button secondary" disabled={state.busy || !confirmed || !file}>
            Tải phiên bản mới
          </button>
        </form>
      ) : null}
      {state.error ? <ErrorNotice error={state.error} retry={state.reload} /> : null}
      {state.loading ? (
        <Loading />
      ) : (
        state.data?.map((item) => (
          <article key={item.file.id}>
            <p>
              Phiên bản {item.versionNumber} · {item.file.status} · {item.file.verification}
            </p>
            <button
              disabled={state.busy}
              onClick={() => void state.mutate(() => download(item.file.id))}
            >
              Tải xuống
            </button>
            {!readOnly ? (
              <>
                <button
                  disabled={state.busy}
                  onClick={() =>
                    void state.mutate(() => foundationApi.documentAction(item.file.id, 'simulate'))
                  }
                >
                  Mô phỏng xử lý
                </button>
                <button
                  disabled={state.busy}
                  onClick={() =>
                    void state.mutate(() => foundationApi.documentAction(item.file.id, 'review'))
                  }
                >
                  Duyệt demo
                </button>
                <button
                  disabled={state.busy}
                  onClick={() =>
                    void state.mutate(() => foundationApi.documentAction(item.file.id, 'delete'))
                  }
                >
                  Xóa tệp giả
                </button>
              </>
            ) : null}
          </article>
        ))
      )}
    </section>
  );
}
