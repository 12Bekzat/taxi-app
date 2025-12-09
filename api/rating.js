// api/ratings.js
import { request } from './client'; // тот же helper, что ты уже используешь

// Оценить заказ (клиент)
export async function rateOrder(orderId, score, comment) {
  return request(`/ratings/orders/${orderId}`, {
    method: 'POST',
    body: { score, comment },
  });
}

// Получить рейтинг водителя + отзывы (для роли DRIVER)
export async function fetchMyDriverRating() {
  return request('/ratings/driver/me', {
    method: 'GET',
  });
}
