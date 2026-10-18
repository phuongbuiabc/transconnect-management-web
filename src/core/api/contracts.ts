export interface Envelope<T> {
  succeeded: boolean;
  message: string | null;
  errorCode: string | null;
  data: T;
  errors: Record<string, string[]> | null;
}
export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}
