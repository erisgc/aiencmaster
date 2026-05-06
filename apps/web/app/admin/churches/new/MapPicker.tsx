'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import styles from './page.module.css';

type Point = { lat: number; lng: number };

const markerIcon = new L.Icon({
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickHandler({ onPick }: { onPick: (p: Point) => void }) {
  useMapEvents({
    click(e) {
      const lat = Number(e.latlng.lat.toFixed(7));
      const lng = Number(e.latlng.lng.toFixed(7));
      onPick({ lat, lng });
    },
  });
  return null;
}

export function MapPicker({
  value,
  onChange,
  center = { lat: 8.106, lng: -73.366 }, // Ocaña aprox (ajústalo)
  zoom = 13,
}: {
  value: Point | null;
  onChange: (p: Point) => void;
  center?: Point;
  zoom?: number;
}) {
  return (
    <div className={styles.mapWrap}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        className={styles.map}
        scrollWheelZoom
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onChange} />
        {value && (
          <Marker
            position={[value.lat, value.lng]}
            icon={markerIcon}
          />
        )}
      </MapContainer>
      <p className={styles.mapHint}>
        Haz click en el mapa para fijar la ubicación.
      </p>
    </div>
  );
}
