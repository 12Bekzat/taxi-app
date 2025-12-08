// api/files.js
import { API_HOST, buildFileUrl, getAuthToken } from './client';

export async function uploadAvatar(fileUri) {
  if (!fileUri) {
    throw new Error('fileUri is required');
  }

  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: 'avatar.jpg',
    type: 'image/jpeg',
  });

  const token = getAuthToken();

  const res = await fetch(`${API_HOST}/api/files/avatar`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // ВАЖНО: Content-Type ставим ЯВНО для RN
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    console.log('uploadAvatar error', res.status, data || text);
    const msg =
      (data && data.message) ||
      `Upload error: ${res.status}`;
    throw new Error(msg);
  }

  // ожидаем { url: "/files/avatars/..." }
  return {
    ...data,
    url: buildFileUrl(data.url),
  };
}
