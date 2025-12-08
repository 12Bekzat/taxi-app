// utils/cluster.js

// Грубая кластеризация точек по "сотам" ~0.01 градуса (~1 км)
export function clusterPoints(points, cell = 0.01) {
  if (!Array.isArray(points) || points.length === 0) return [];

  const buckets = new Map();

  for (const p of points) {
    if (!p || typeof p.latitude !== 'number' || typeof p.longitude !== 'number') continue;

    const gx = Math.round(p.latitude / cell);
    const gy = Math.round(p.longitude / cell);
    const key = `${gx}:${gy}`;

    const list = buckets.get(key) || [];
    list.push(p);
    buckets.set(key, list);
  }

  const clusters = [];
  for (const [, list] of buckets.entries()) {
    const lat = list.reduce((sum, p) => sum + p.latitude, 0) / list.length;
    const lon = list.reduce((sum, p) => sum + p.longitude, 0) / list.length;
    clusters.push({ latitude: lat, longitude: lon, count: list.length });
  }

  return clusters;
}
