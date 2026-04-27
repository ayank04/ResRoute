import { MapContainer as LeafletMap, TileLayer, useMap } from 'react-leaflet';
import { ReactNode, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// @ts-ignore
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface Props {
  center: { lat: number; lng: number };
  zoom?: number;
  children?: ReactNode;
  onClick?: (e: any) => void;
  mapRef?: (map: L.Map) => void;
}

const isValidLatLng = (lat: any, lng: any): boolean => {
  return (
    lat !== undefined && lng !== undefined &&
    lat !== null && lng !== null &&
    !isNaN(Number(lat)) && !isNaN(Number(lng)) &&
    Number(lat) >= -90 && Number(lat) <= 90 &&
    Number(lng) >= -180 && Number(lng) <= 180
  )
}

function MapController({ center, zoom }: { center: { lat: number; lng: number }, zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (isValidLatLng(center.lat, center.lng)) {
      map.setView([center.lat, center.lng], zoom);
    }
  }, [center, zoom, map]);
  return null;
}


export default function MapContainer({ center, zoom = 13, children, mapRef }: Props) {
  return (
    <div className="glass" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <LeafletMap
        center={isValidLatLng(center.lat, center.lng) ? [center.lat, center.lng] : [12.9716, 77.5946]}
        zoom={zoom}
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
        ref={(ref) => {
          if (ref && mapRef) {
            mapRef(ref);
          }
        }}
      >
        {/* Dark Matter tiles from CartoDB - Very premium look */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        <MapController center={center} zoom={zoom} />
        
        {children}
        
        <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Custom zoom controls if needed, or just let Leaflet handle it */}
        </div>
      </LeafletMap>

      {/* Overlay for map depth/vignette */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        boxShadow: 'inset 0 0 100px rgba(0,0,0,0.4)',
        zIndex: 400
      }} />
    </div>
  );
}
