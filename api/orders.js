// api/orders.js
import { request } from './client';

// создание заказа клиентом
export async function createOrder(payload) {
  // payload: { equipmentTypeId, originAddress, originLat, originLon, destinationAddress?, ... }
  const data = await request('/orders', {
    method: 'POST',
    body: payload,
  });
  return data;
}

// активные заказы клиента
export async function fetchMyActiveOrders() {
  const data = await request('/orders/me/active', { method: 'GET' });
  return data;
}

// заказы для водителя
export async function fetchDriverAvailableOrders() {
  const data = await request('/orders/driver/available', { method: 'GET' });
  return data;
}

export async function fetchDriverActiveOrders() {
  const data = await request('/orders/driver/active', { method: 'GET' });
  return data;
}

export async function driverAcceptOrder(orderId, destination) {
  const data = await request(`/orders/driver/${orderId}/accept`, {
    method: 'POST',
    body: { ...destination },
  });
  return data;
}

export async function driverStartOrder(orderId) {
  const data = await request(`/orders/driver/${orderId}/start`, {
    method: 'POST',
  });
  return data;
}

export async function driverFinishOrder(orderId) {
  const data = await request(`/orders/driver/${orderId}/finish`, {
    method: 'POST',
  });
  return data;
}

// история/доходы водителя
export async function fetchDriverEarnings(fromIso, toIso) {
  const data = await request(
    `/orders/driver/earnings?from=${encodeURIComponent(
      fromIso,
    )}&to=${encodeURIComponent(toIso)}`,
    { method: 'GET' },
  );
  return data;
}

export async function fetchLastCompletedUnratedOrder() {
  try {
    const data = await request('/orders/customer/last-completed-unrated', {
      method: 'GET',
    });
    return data; // OrderResponse или 404/empty
  } catch (e) {
    // если 404 — просто вернём null
    console.log('fetchLastCompletedUnratedOrder error', e);
    return null;
  }
}
