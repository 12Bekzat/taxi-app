// api/driverVehicle.js
import { API_HOST as API_URL } from './client';
import { getAuthToken } from './client';

// получить текущую технику водителя
export async function fetchDriverVehicle() {
  const token = await getAuthToken();

  const res = await fetch(`${API_URL}/api/driver/vehicle`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`fetchDriverVehicle failed: ${res.status} ${text}`);
  }
  return res.json(); // { equipmentTypeId, typeName, model, plateNumber, color, photoUrl, ... }
}

// сохранить/обновить технику
export async function saveDriverVehicle(data, photoUri) {
  const token = await getAuthToken();

  // если есть фото — шлём multipart
  if (photoUri) {
    const form = new FormData();
    form.append('equipmentTypeId', String(data.equipmentTypeId));
    form.append('model', data.model || '');
    form.append('plateNumber', data.plateNumber || '');
    form.append('color', data.color || '');
    form.append('year', data.year ? String(data.year) : '');
    form.append('photo', {
      uri: photoUri,
      name: 'vehicle.jpg',
      type: 'image/jpeg',
    });

    const res = await fetch(`${API_URL}/api/driver/vehicle`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`saveDriverVehicle failed: ${res.status} ${text}`);
    }
    return res.json();
  }

  // без фото — обычный JSON
  const res = await fetch(`${API_URL}/api/driver/vehicle`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`saveDriverVehicle failed: ${res.status} ${text}`);
  }
  return res.json();
}
