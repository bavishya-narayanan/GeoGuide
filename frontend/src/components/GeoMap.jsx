import L from 'leaflet';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

const DEFAULT_CENTER = { latitude: 11.1271, longitude: 78.6569 };

function validCoordinate(latitude, longitude) {
  return Number.isFinite(Number(latitude)) && Number(latitude) >= -90 && Number(latitude) <= 90
    && Number.isFinite(Number(longitude)) && Number(longitude) >= -180 && Number(longitude) <= 180;
}

function toPoint(location) {
  return location && validCoordinate(location.latitude, location.longitude)
    ? [Number(location.latitude), Number(location.longitude)]
    : null;
}

function markerIcon(className) {
  return L.divIcon({ className: `geo-marker ${className}`, html: '<span></span>', iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -13] });
}

const placeIcon = markerIcon('place-marker');
const userIcon = markerIcon('user-marker');
const selectedIcon = markerIcon('selected-marker');

function distanceLabel(meters) {
  if (meters === undefined || meters === null || !Number.isFinite(Number(meters))) return null;
  return Number(meters) < 1000 ? `${Math.round(Number(meters))} m away` : `${(Number(meters) / 1000).toFixed(1)} km away`;
}

function MapViewport({ center, userLocation, places, focusPlaceId }) {
  const map = useMap();
  const validPlaces = places.map((place) => ({ ...place, point: toPoint(place) })).filter((place) => place.point);
  const centerPoint = toPoint(center) || [DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude];
  const userPoint = toPoint(userLocation);

  useEffect(() => {
    const focused = validPlaces.find((place) => String(place.osm_id) === String(focusPlaceId));
    if (focused) map.flyTo(focused.point, Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [focusPlaceId]);

  useEffect(() => {
    const points = [centerPoint, ...validPlaces.map((place) => place.point)];
    if (userLocation?.source === 'current' && userPoint) points.push(userPoint);
    if (validPlaces.length || userPoint) map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 15 });
    else map.setView(centerPoint, 12);
  }, [center?.latitude, center?.longitude, userLocation?.source, places]);

  return null;
}

function MapClickHandler({ onMapLocationSelect }) {
  useMapEvents({ click: (event) => onMapLocationSelect?.({ latitude: event.latlng.lat, longitude: event.latlng.lng, source: 'manual', label: 'Selected map location' }) });
  return null;
}

export default function GeoMap({ center, userLocation, places, radius, selectedLocation, focusPlaceId, onMapLocationSelect, onPlaceSelect, onLocateMe, onSearchHere }) {
  const [tileError, setTileError] = useState(false);
  const centerPoint = toPoint(center) || [DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude];
  const userPoint = userLocation?.source === 'current' ? toPoint(userLocation) : null;
  const selectedPoint = toPoint(selectedLocation);
  const validPlaces = useMemo(() => places.map((place) => ({ ...place, point: toPoint(place) })).filter((place) => {
    if (!toPoint(place)) console.warn('Skipping place marker with invalid coordinates', place.osm_id);
    return toPoint(place);
  }), [places]);

  return <section className="map-panel" aria-label="Interactive place map">
    <div className="map-toolbar"><span><strong>{center?.source === 'current' ? 'Near your current location' : center?.source === 'manual' ? 'Selected map location' : center?.label ? `Searching around ${center.label}` : 'Choose a location'}</strong><small>{validPlaces.length} place{validPlaces.length === 1 ? '' : 's'} found</small></span><button className="outline-button map-locate" type="button" onClick={onLocateMe}><span aria-hidden="true">◎</span> Locate Me</button></div>
    <div className="map-frame">
      <MapContainer center={centerPoint} zoom={12} scrollWheelZoom className="geo-map">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors' eventHandlers={{ tileerror: () => setTileError(true) }} />
        <MapViewport center={center} userLocation={userLocation} places={places} focusPlaceId={focusPlaceId} />
        <MapClickHandler onMapLocationSelect={onMapLocationSelect} />
        {userPoint && <><Marker position={userPoint} icon={userIcon}><Popup><strong>Your Location</strong><br />Current search center</Popup></Marker><Circle center={userPoint} radius={Number(radius) * 1000} pathOptions={{ color: '#cf5c36', fillColor: '#cf5c36', fillOpacity: 0.08, weight: 2 }} /></>}
        {center?.source !== 'current' && centerPoint && <Circle center={centerPoint} radius={Number(radius) * 1000} pathOptions={{ color: '#cf5c36', fillColor: '#cf5c36', fillOpacity: 0.08, weight: 2 }} />}
        {selectedPoint && <Marker position={selectedPoint} icon={selectedIcon}><Popup><strong>Selected map location</strong><br />{selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}</Popup></Marker>}
        {validPlaces.map((place) => <Marker key={place.osm_id} position={place.point} icon={placeIcon} eventHandlers={{ click: () => onPlaceSelect?.(place) }}><Popup><div className="map-popup"><strong>{place.display_name || place.name || `${(place.category || 'Place').charAt(0).toUpperCase() + (place.category || 'Place').slice(1).replace(/_/g, ' ')}${place.city ? ' · ' + place.city : ''}`}</strong><span>{place.category || 'Place'}</span><span>{place.city || 'Tamil Nadu'}</span>{distanceLabel(place.distance_meters) && <span>{distanceLabel(place.distance_meters)}</span>}<Link to={`/places/${place.osm_id}`}>View Details</Link></div></Popup></Marker>)}
      </MapContainer>
      {tileError && <div className="map-error">Map tiles could not be loaded. Check your connection and try again.</div>}
      <div className="map-legend"><span><i className="legend-dot user-dot" /> Your location</span><span><i className="legend-dot place-dot" /> Place</span></div>
      {selectedPoint && <button className="search-here-button primary-button" type="button" onClick={onSearchHere}>Search This Area</button>}
    </div>
  </section>;
}
