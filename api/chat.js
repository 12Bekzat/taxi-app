// api/chat.js
import { request } from './client';

// получить сообщения по заказу
export async function fetchChatMessages(orderId, lastId) {
  let url = `/chat/orders/${orderId}`;
  if (lastId) {
    url += `?lastId=${encodeURIComponent(lastId)}`;
  }
  return request(url, { method: 'GET' });
}

// отправить сообщение
export async function sendChatMessage(orderId, text) {
  return request(`/chat/orders/${orderId}`, {
    method: 'POST',
    body: { text },
  });
}
