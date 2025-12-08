// utils/routing.js
import { MAPTILER_KEY } from '../constants/maps';

const OSRM = 'https://router.project-osrm.org';
// Nominatim больше не используем напрямую
// const NOMINATIM = 'https://nominatim.openstreetmap.org';

const MAPTILER_GEOCODE = 'https://api.maptiler.com/geocoding';

/**
 * Поиск по адресу (автодополнение)
 */
export async function geocode(query, cityHint = 'Алматы') {
  if (!query || !query.trim()) return [];

  const searchText = cityHint
    ? `${query.trim()}, ${cityHint}`
    : query.trim();

  const url =
    `${MAPTILER_GEOCODE}/${encodeURIComponent(searchText)}.json` +
    `?key=${MAPTILER_KEY}&language=ru&limit=5&country=KZ`;

  const res = await fetch(url);
  if (!res.ok) {
    console.log('geocode error', res.status, res.url);
    return [];
  }

  const data = await res.json();
  // MapTiler возвращает features
  if (!Array.isArray(data.features)) return [];

  return data.features.map((f) => {
    const [lon, lat] = f.center || f.geometry?.coordinates || [0, 0];
    return {
      label: f.place_name || f.text || '',
      lat,
      lon,
    };
  });
}

/**
 * Reverse-geocode — из координат в строку адреса
 */
export async function reverseGeocode(lat, lon) {
  const url =
    `${MAPTILER_GEOCODE}/${lon},${lat}.json` +
    `?key=${MAPTILER_KEY}&language=ru&limit=1&country=KZ`;

  const res = await fetch(url);
  if (!res.ok) {
    console.log('reverse error', res.status, res.url);
    return '';
  }

  const data = await res.json();
  const f = Array.isArray(data.features) ? data.features[0] : null;
  if (!f) return '';
  return f.place_name || f.text || '';
}

/**
 * Маршрут — оставляем OSRM, он работает
 */
export async function routeDriving(from, to) {
  const coords = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
  const url = `${OSRM}/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) {
    console.log('route error', res.status);
    return null;
  }

  const data = await res.json();
  const r = data.routes?.[0];
  if (!r) return null;

  const distanceKm = r.distance / 1000;
  const durationMin = Math.round(r.duration / 60);
  const points = r.geometry.coordinates.map(([lon, lat]) => ({
    latitude: lat,
    longitude: lon,
  }));

  return { points, distanceKm, durationMin };
}
