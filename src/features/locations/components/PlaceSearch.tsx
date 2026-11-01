import { useId, useState } from 'react';
import { ErrorNotice } from '../../../shared/ui';
import type { PlaceSearchResult } from '../models/location';
import { usePlaceSearch } from '../hooks/usePlaceSearch';

export function PlaceSearch({ onSelect }: { onSelect: (place: PlaceSearchResult) => void }) {
  const id = useId();
  const [query, setQuery] = useState('');
  const state = usePlaceSearch();
  const valid = query.trim().length >= 3;
  return (
    <div className="place-search" role="search" aria-label="Tìm địa điểm trên bản đồ">
      <label htmlFor={id}>Tìm địa điểm công cộng</label>
      <div className="place-search-controls">
        <input
          id={id}
          value={query}
          maxLength={200}
          placeholder="Ví dụ: Bến xe Miền Đông mới"
          onChange={(event) => {
            setQuery(event.target.value);
            state.clear();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              if (valid && !state.loading) void state.search(query);
            }
          }}
        />
        <button
          type="button"
          className="button secondary"
          disabled={!valid || state.loading}
          onClick={() => void state.search(query)}
        >
          {state.loading ? 'Đang tìm…' : 'Tìm trên bản đồ'}
        </button>
      </div>
      <p className="locations-hint">
        Nhập tên bến xe, điểm công cộng. Không gửi thông tin cá nhân. Chọn kết quả rồi kiểm tra ghim
        và tỉnh/phường trước khi lưu.
      </p>
      {state.error ? <ErrorNotice error={state.error} /> : null}
      {state.searched && !state.items.length ? (
        <p role="status">Không tìm thấy địa điểm phù hợp. Thử tên khác hoặc chọn ghim thủ công.</p>
      ) : null}
      {!!state.items.length && (
        <ul className="place-search-results" aria-label="Kết quả tìm địa điểm">
          {state.items.map((place, index) => (
            <li key={place.sourceId || index}>
              <button
                type="button"
                onClick={() => {
                  onSelect(place);
                  state.clear();
                }}
              >
                <strong>{place.name}</strong>
                <span>{place.displayName}</span>
                <small>Chọn vị trí này</small>
              </button>
            </li>
          ))}
        </ul>
      )}
      <small>
        Nguồn tìm kiếm:{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
          © OpenStreetMap contributors
        </a>
      </small>
    </div>
  );
}
