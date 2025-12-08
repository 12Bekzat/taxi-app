// api/support.js
import { API_HOST as API_URL, getAuthToken } from './client';

export async function createSupportTicket(subject, message) {
  const token = await getAuthToken();

  const res = await fetch(`${API_URL}/api/support`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : undefined,
    },
    body: JSON.stringify({ subject, message }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`createSupportTicket failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function fetchMySupportTickets() {
  const token = await getAuthToken();

  const res = await fetch(`${API_URL}/api/support/my`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`fetchMySupportTickets failed: ${res.status} ${text}`);
  }

  return res.json();
}
