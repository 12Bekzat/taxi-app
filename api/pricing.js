import { API_HOST, getAuthToken } from "./client";

export async function fetchEquipmentPricePerMinute(
  params,
) {
  const token = await getAuthToken();

  const search = new URLSearchParams();
  search.set('equipmentCode', params.equipmentCode);
  search.set('regionId', String(params.regionId));

  if (params.lat != null) search.set('lat', String(params.lat));
  if (params.lon != null) search.set('lon', String(params.lon));

  const res = await fetch(
    `${API_HOST}/api/pricing/per-minute?${search.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `fetchEquipmentPricePerMinute failed: ${res.status} ${text}`,
    );
  }

  return res.json();
}