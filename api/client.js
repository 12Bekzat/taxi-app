// api/client.js

// ВАЖНО:
// - Android эмулятор → http://10.0.2.2:8080/api
// - iOS симулятор → http://localhost:8080/api
// - Реальное устройство → http://<IP_твоего_ПК>:8080/api
export const API_HOST = 'http://192.168.0.104:5001';
// api/client.js

// Для Android-эмулятора:
// Для реального телефона нужно IP твоего ПК
// export const API_HOST = 'http://192.168.0.42:8080';

export const BASE_URL = `${API_HOST}/api`;

let authToken = null;

export function setAuthToken(token) {
  authToken = token || null;
}

export function getAuthToken() {
  return authToken;
}

// Делает из "/files/avatars/..." -> "http://10.0.2.2:8080/files/avatars/..."
export function buildFileUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (!path.startsWith('/')) path = `/${path}`;
  return `${API_HOST}${path}`;
}

export async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const { method = 'GET', headers = {}, body } = options;

  const isFormData =
    typeof FormData !== 'undefined' && body instanceof FormData;

  const finalHeaders = {
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...headers,
  };

  if (!isFormData && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  const resp = await fetch(url, {
    method,
    headers: finalHeaders,
    body: isFormData
      ? body
      : body != null
      ? JSON.stringify(body)
      : undefined,
  });

  const text = await resp.text();
  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!resp.ok) {
    const err = new Error(
      (data && data.message) || `API error: ${resp.status}`,
    );
    err.status = resp.status;
    err.data = data;
    throw err;
  }

  return data;
}
