import { request } from '../../../core/api/client';
import type { PagedResult } from '../../../core/api/contracts';
import type {
  AdministrativeUnit,
  LocationInput,
  LocationRequest,
  SharedLocation,
  LocationVersion,
  PlaceSearchResult,
} from '../models/location';
const root = '/locations';
export const locationsApi = {
  searchPlaces: (query: string, signal: AbortSignal) =>
    request<PlaceSearchResult[]>(root + '/place-search?query=' + encodeURIComponent(query), {
      signal,
    }),
  provinces: (signal: AbortSignal) =>
    request<AdministrativeUnit[]>(root + '/provinces', { signal }),
  wards: (provinceCode: string, signal: AbortSignal) =>
    request<AdministrativeUnit[]>(
      root + '/wards?provinceCode=' + encodeURIComponent(provinceCode),
      { signal },
    ),
  history: (id: string, signal: AbortSignal) =>
    request<LocationVersion[]>(root + '/admin/shared/' + id + '/history', { signal }),
  shared: (search: string, page: number, signal: AbortSignal, admin = false) =>
    request<PagedResult<SharedLocation>>(
      root +
        (admin ? '/admin' : '') +
        '/shared?search=' +
        encodeURIComponent(search) +
        '&pageNumber=' +
        page +
        '&pageSize=20',
      { signal },
    ),
  requests: (organizationId: string | undefined, signal: AbortSignal) =>
    request<LocationRequest[]>(
      organizationId
        ? root + '/requests?organizationId=' + encodeURIComponent(organizationId)
        : root + '/admin/requests',
      { signal },
    ),
  save: (value: LocationInput, selected: SharedLocation | null, organizationId?: string) =>
    request(
      organizationId
        ? root + '/requests'
        : root + '/admin/shared' + (selected ? '/' + selected.id : ''),
      {
        method: organizationId || !selected ? 'POST' : 'PUT',
        body: JSON.stringify({
          ...value,
          ...(organizationId
            ? {
                organizationId,
                kind: selected ? 'Update' : 'Create',
                locationId: selected?.id,
                baseVersion: selected?.version,
              }
            : { version: selected?.version }),
        }),
      },
    ),
  archive: (item: SharedLocation, reason: string, organizationId?: string) =>
    request(organizationId ? root + '/requests' : root + '/admin/shared/' + item.id, {
      method: organizationId ? 'POST' : 'DELETE',
      body: JSON.stringify(
        organizationId
          ? {
              organizationId,
              kind: 'Archive',
              locationId: item.id,
              baseVersion: item.version,
              reason,
            }
          : { version: item.version, reason },
      ),
    }),
  review: (item: LocationRequest, approve: boolean, reason: string) =>
    request(root + '/admin/requests/' + item.id + '/review', {
      method: 'POST',
      body: JSON.stringify({ approve, reason, version: item.version }),
    }),
};
