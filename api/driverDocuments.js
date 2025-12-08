// api/driverDocuments.js
import { API_HOST } from './client';
import { getAuthToken } from './client'; // или откуда берёшь токен

// Список документов водителя
export async function fetchDriverDocuments() {
  const token = await getAuthToken();

  const res = await fetch(`${API_HOST}/api/driver/documents`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`fetchDriverDocuments failed: ${res.status} ${text}`);
  }
  return res.json();
}

// Загрузка конкретного документа (тип + сторона)
export async function uploadDriverDocument(docType, side, uri) {
  const token = await getAuthToken();

  const form = new FormData();
  form.append('documentType', docType); // DRIVER_LICENSE / ID_CARD
  form.append('side', side);           // FRONT / BACK
  form.append('file', {
    uri,
    name: `${docType}_${side}.jpg`,
    type: 'image/jpeg',
  });

  const res = await fetch(`${API_HOST}/api/driver/documents`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // Content-Type НЕ ставим — RN сам проставит boundary
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`uploadDriverDocument failed: ${res.status} ${text}`);
  }

  return res.json(); // ожидаем { id, documentType, side, url, status, ... }
}
