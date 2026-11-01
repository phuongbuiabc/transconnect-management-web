import { useCallback, useState } from 'react';
import { locationsApi } from '../api/locationsApi';
import { useLocations } from '../hooks/useLocations';
import type { LocationInput, SharedLocation } from '../models/location';
import { LocationMap } from './LocationMap';
import { PlaceSearch } from './PlaceSearch';
import { ErrorNotice } from '../../../shared/ui';
export function LocationForm({
  initial,
  busy,
  onSave,
  onCancel,
}: {
  initial: SharedLocation | null;
  busy: boolean;
  onSave: (value: LocationInput) => void;
  onCancel: () => void;
}) {
  const [province, setProvince] = useState(initial?.provinceCode ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [address, setAddress] = useState(initial?.addressDetail ?? '');
  const [ward, setWard] = useState(initial?.wardCode ?? '');
  const [lat, setLat] = useState(initial?.latitude.toString() ?? '');
  const [lon, setLon] = useState(initial?.longitude.toString() ?? '');
  const [method, setMethod] = useState('ManualCoordinates');
  const [confirmed, setConfirmed] = useState(false);
  const provinces = useLocations(useCallback((signal) => locationsApi.provinces(signal), []));
  const wards = useLocations(
    useCallback(
      (signal) => (province ? locationsApi.wards(province, signal) : Promise.resolve([])),
      [province],
    ),
  );
  const latitude =
    lat.trim() !== '' && Number.isFinite(Number(lat)) && Math.abs(Number(lat)) <= 90
      ? Number(lat)
      : null;
  const longitude =
    lon.trim() !== '' && Number.isFinite(Number(lon)) && Math.abs(Number(lon)) <= 180
      ? Number(lon)
      : null;
  const datasetId = wards.data?.find((item) => item.code === ward)?.datasetId;
  return (
    <form
      className="locations-form"
      aria-label={initial ? 'Sửa địa điểm' : 'Thêm địa điểm'}
      onChange={() => setConfirmed(false)}
      onSubmit={(event) => {
        event.preventDefault();
        if (!confirmed || latitude === null || longitude === null || !datasetId) return;
        const form = new FormData(event.currentTarget);
        onSave({
          name: String(form.get('name')),
          type: String(form.get('type')),
          datasetId,
          provinceCode: province,
          wardCode: ward,
          addressDetail: String(form.get('addressDetail')),
          accessInstructions: String(form.get('accessInstructions')),
          reason: String(form.get('reason')),
          latitude,
          longitude,
          confirmationMethod: method,
        });
      }}
    >
      <div className="locations-form-heading">
        <h2>{initial ? 'Sửa thông tin cùng điểm phục vụ' : 'Thêm địa điểm mới'}</h2>
      </div>
      <p>
        Đổi sang cổng hoặc điểm tập kết khác: hãy tạo địa điểm mới. Điểm này không tự cấp quyền
        đón/trả cho mọi tuyến.
      </p>
      {provinces.error ? <ErrorNotice error={provinces.error} retry={provinces.reload} /> : null}
      {wards.error ? <ErrorNotice error={wards.error} retry={wards.reload} /> : null}
      <fieldset disabled={busy} className="locations-form-grid">
        <legend className="sr-only">Thông tin và vị trí địa điểm</legend>
        <div className="locations-form-fields">
          <label>
            Tên địa điểm
            <input
              required
              name="name"
              maxLength={200}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Loại
            <select name="type" defaultValue={initial?.type ?? 'BusStation'}>
              <option value="BusStation">Bến xe</option>
              <option value="PickupPoint">Điểm đón/trả</option>
              <option value="Warehouse">Kho hàng</option>
              <option value="Parking">Bãi xe</option>
              <option value="Other">Khác</option>
            </select>
          </label>
          <label>
            Tỉnh/thành
            <select
              required
              name="provinceCode"
              disabled={provinces.loading || !!provinces.error}
              value={province}
              onChange={(e) => {
                setProvince(e.target.value);
                setWard('');
              }}
            >
              <option value="">
                {provinces.loading ? 'Đang tải tỉnh/thành…' : 'Chọn tỉnh/thành'}
              </option>
              {provinces.data?.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Xã/phường
            <select
              required
              name="wardCode"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              disabled={!province || wards.loading || !!wards.error}
            >
              <option value="">{wards.loading ? 'Đang tải xã/phường…' : 'Chọn xã/phường'}</option>
              {wards.data?.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Địa chỉ chi tiết
            <input
              required
              name="addressDetail"
              maxLength={500}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>
          <label>
            Chỉ dẫn tiếp cận
            <textarea
              name="accessInstructions"
              maxLength={1000}
              defaultValue={initial?.accessInstructions ?? undefined}
            />
          </label>
          <label>
            Lý do tạo/thay đổi
            <textarea
              required
              name="reason"
              maxLength={1000}
              placeholder="Căn cứ tạo mới hoặc thay đổi địa điểm"
            />
          </label>
        </div>
        <div className="locations-form-map">
          <h3>Vị trí trên bản đồ</h3>
          <p>Chọn ghim đúng cổng hoặc điểm phục vụ, sau đó xác nhận địa chỉ.</p>
          <PlaceSearch
            onSelect={(place) => {
              setName(place.name);
              setAddress(place.displayName);
              setLat(place.latitude.toFixed(7));
              setLon(place.longitude.toFixed(7));
              setMethod('MapPin');
              setConfirmed(false);
            }}
          />
          <LocationMap
            latitude={latitude}
            longitude={longitude}
            onPick={(a, b) => {
              setLat(a.toFixed(7));
              setLon(b.toFixed(7));
              setMethod('MapPin');
              setConfirmed(false);
            }}
          />
          <label>
            Vĩ độ
            <input
              required
              type="number"
              step="any"
              min="-90"
              max="90"
              value={lat}
              onChange={(e) => {
                setLat(e.target.value);
                setMethod('ManualCoordinates');
              }}
            />
          </label>
          <label>
            Kinh độ
            <input
              required
              type="number"
              step="any"
              min="-180"
              max="180"
              value={lon}
              onChange={(e) => {
                setLon(e.target.value);
                setMethod('ManualCoordinates');
              }}
            />
          </label>
          <button
            className={confirmed ? 'button locations-confirmed' : 'button secondary'}
            type="button"
            disabled={latitude === null || longitude === null}
            onClick={() => setConfirmed(true)}
          >
            {confirmed ? 'Đã xác nhận vị trí' : 'Xác nhận vị trí và địa chỉ'}
          </button>
          <p className="locations-hint" role="status">
            {confirmed
              ? 'Vị trí đã xác nhận. Bạn có thể lưu địa điểm.'
              : 'Chọn tỉnh/phường, điền thông tin và xác nhận vị trí để lưu.'}
          </p>
        </div>
      </fieldset>
      <footer className="locations-form-actions">
        <button className="button primary" disabled={busy || !confirmed || !datasetId}>
          {busy ? 'Đang lưu…' : 'Lưu / gửi đề xuất'}
        </button>
        <button className="button secondary" type="button" disabled={busy} onClick={onCancel}>
          Đóng
        </button>
      </footer>
    </form>
  );
}
