import { ApiError } from './apiError';
import type { Envelope } from './contracts';
export function createTransport(baseUrl: string) {
  async function transport<T>(path: string, init: RequestInit, bearer?: string): Promise<T> {
    if (!path.startsWith('/') || path.startsWith('//'))
      throw new Error('API path must be relative to the backend.');
    let response: Response;
    try {
      response = await fetch(baseUrl + path, {
        ...init,
        headers: {
          Accept: 'application/json',
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          ...(bearer ? { Authorization: 'Bearer ' + bearer } : {}),
          ...init.headers,
        },
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      throw new ApiError(0, 'Không thể kết nối máy chủ. Kiểm tra kết nối và cấu hình API.');
    }
    let envelope: Envelope<T> | null = null;
    try {
      envelope = (await response.json()) as Envelope<T>;
    } catch {
      /* Reject non-JSON responses below. */
    }
    if (!response.ok || envelope?.succeeded !== true) {
      const fallback: Record<number, string> = {
        401: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
        403: 'Bạn không có quyền thực hiện thao tác này.',
        404: 'Không tìm thấy hồ sơ.',
        409: 'Hồ sơ đã thay đổi. Hãy tải lại trước khi tiếp tục.',
        429: 'Có quá nhiều yêu cầu. Vui lòng thử lại sau.',
      };
      throw new ApiError(
        response.status,
        envelope?.message || fallback[response.status] || 'Máy chủ trả về phản hồi không hợp lệ.',
        envelope?.errorCode || '',
        envelope?.errors || {},
      );
    }
    if (!Object.prototype.hasOwnProperty.call(envelope, 'data')) {
      throw new ApiError(response.status, 'Phản hồi thiếu dữ liệu.', 'INVALID_RESPONSE');
    }
    return envelope.data;
  }

  return transport;
}
