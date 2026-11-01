import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
export function LocationMap({
  latitude,
  longitude,
  onPick,
}: {
  latitude: number | null;
  longitude: number | null;
  onPick: (latitude: number, longitude: number) => void;
}) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const tiles = useRef<L.TileLayer | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const callback = useRef(onPick);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    callback.current = onPick;
  }, [onPick]);
  useEffect(() => {
    if (!element.current) return;
    const instance = L.map(element.current).setView([16.1, 107.8], 5);
    map.current = instance;
    const layer = L.tileLayer(
      import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          import.meta.env.VITE_MAP_ATTRIBUTION ||
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    ).addTo(instance);
    tiles.current = layer;
    layer.on('tileerror', () => setFailed(true));
    instance.on('click', (e: L.LeafletMouseEvent) => callback.current(e.latlng.lat, e.latlng.lng));
    return () => {
      instance.remove();
      map.current = null;
      tiles.current = null;
      marker.current = null;
    };
  }, []);
  useEffect(() => {
    if (!map.current) return;
    if (latitude === null || longitude === null) {
      marker.current?.remove();
      marker.current = null;
      return;
    }
    const point: L.LatLngExpression = [latitude, longitude];
    if (!marker.current) {
      marker.current = L.marker(point, {
        draggable: true,
        icon: L.divIcon({
          className: '',
          html: '<span style="font-size:30px" aria-label="Vị trí đã chọn">📍</span>',
          iconSize: [30, 38],
          iconAnchor: [15, 38],
        }),
      }).addTo(map.current);
      marker.current.on('dragend', () => {
        const position = marker.current!.getLatLng();
        callback.current(position.lat, position.lng);
      });
    } else marker.current.setLatLng(point);
    map.current.setView(point, Math.max(map.current.getZoom(), 14));
  }, [latitude, longitude]);
  return (
    <>
      <div
        ref={element}
        style={{ height: 320, width: '100%', zIndex: 0 }}
        aria-label="Bản đồ chọn vị trí"
      />
      {failed ? (
        <div className="location-map-error" role="status">
          <p>
            Không tải được ảnh nền bản đồ. Kiểm tra kết nối mạng hoặc DNS, rồi thử lại. Bạn vẫn có
            thể nhập và xác nhận tọa độ bên dưới.
          </p>
          <button
            type="button"
            className="button secondary location-map-retry"
            onClick={() => {
              setFailed(false);
              tiles.current?.redraw();
            }}
          >
            Thử tải lại bản đồ
          </button>
        </div>
      ) : null}
      <p>Nhấn bản đồ hoặc kéo ghim, sau đó xác nhận vị trí.</p>
    </>
  );
}
