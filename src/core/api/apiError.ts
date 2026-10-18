export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = '',
    public fields: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Đã xảy ra lỗi. Vui lòng thử lại.';
}
