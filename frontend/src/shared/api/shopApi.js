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

export function getOrderStatus(reference, mobileNumber) {
  const params = new URLSearchParams({
    reference,
    mobileNumber
  });

  return http(`/orders?${params.toString()}`);
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

export function getAdminOrders(accessToken) {
  return http("/admin/orders", {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`
        }
      : {}
  });
}

export function updateAdminOrder(orderId, payload, accessToken) {
  return http(`/admin/orders/${orderId}`, {
    method: "PATCH",
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`
        }
      : {},
    body: JSON.stringify(payload)
  });
}

export function getAdminAccount(accessToken) {
  return http("/admin/account", {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`
        }
      : {}
  });
}

export function getAdminProducts(accessToken) {
  return http("/admin/products", {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`
        }
      : {}
  });
}

export function createAdminProduct(payload, accessToken) {
  return http("/admin/products", {
    method: "POST",
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`
        }
      : {},
    body: JSON.stringify(payload)
  });
}

export function deleteAdminProduct(productId, accessToken) {
  return http(`/admin/products/${productId}`, {
    method: "DELETE",
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`
        }
      : {}
  });
}
