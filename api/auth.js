// api/auth.js
import { buildFileUrl, request, setAuthToken } from './client';

/**
 * Регистрация:
 * payload:
 * {
 *   phone, email?, password, role, firstName, lastName,
 *   driverProfile?, customerProfile?
 * }
 */
export async function registerUser(payload) {
    console.log('paydata', payload);
  const data = await request('/auth/register', {
    method: 'POST',
    body: payload,
  });
  console.log('data', data);

  const token = data?.token;
  if (token) {
    setAuthToken(token);
  }
  return token;
}

/**
 * Логин по телефону
 */
export async function loginUser(phone, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: { phone, password },
  });

  const token = data?.token;
  if (token) {
    setAuthToken(token);
  }
  return token;
}

/**
 * Получить текущего пользователя (/auth/me)
 */
export async function fetchCurrentUser() {
  const data = await request('/auth/me', { method: 'GET' });
  if (data) {
    data.avatarUrl = buildFileUrl(data.avatarUrl);
  }
  return data;
}

export async function apiUpdateProfile(data) {
  const updated = await request('/auth/me', {
    method: 'PUT',
    body: data,
  });
  if (updated) {
    updated.avatarUrl = buildFileUrl(updated.avatarUrl);
  }
  return updated;
}
