import { http } from "./http";

export function getCatalog() {
  return http("/catalog");
}

export function getOrders(accessToken) {
  return http("/orders", {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`
        }
      : {}
  });
}

export function createOrder(payload, accessToken) {
  return http("/orders", {
    method: "POST",
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`
        }
      : {},
    body: JSON.stringify(payload)
  });
}

export function createCheckoutSession(order, accessToken) {
  return http("/checkout", {
    method: "POST",
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`
        }
      : {},
    body: JSON.stringify({ orderId: order.id, total: order.total })
  });
}
