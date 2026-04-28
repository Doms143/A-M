import { useMemo, useState } from "react";

const initialProductForm = {
  name: "",
  category: "refreshments",
  description: "",
  price: ""
};

function getCustomerName(order) {
  return order.customer_name || order.guest_name || "Unknown customer";
}

function getAddressNote(order) {
  return order.address_note || order.villa_number || "No address note";
}

function formatDateTime(value) {
  if (!value) {
    return "Unknown";
  }

  try {
    return new Intl.DateTimeFormat("en-PH", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function AdminPanel({
  orders,
  products,
  onRefreshOrders,
  onCreateProduct,
  onAcceptOrder,
  isSavingProduct,
  isUpdatingOrder
}) {
  const [formState, setFormState] = useState(initialProductForm);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    await onCreateProduct(formState);
    setFormState(initialProductForm);
  }

  async function handleAcceptOrder() {
    if (!selectedOrder) {
      return;
    }

    await onAcceptOrder(selectedOrder.id);
    setSelectedOrderId(null);
  }

  return (
    <>
      <div className="admin-grid">
        <section className="card admin-section-card">
          <div className="section-header compact">
            <div>
              <h2>Admin products</h2>
              <p>Add or update active catalog products in Supabase.</p>
            </div>
            <span>{products.length} items</span>
          </div>

          <form className="checkout-form" onSubmit={handleSubmit}>
            <input
              className="text-input"
              placeholder="Product name"
              required
              value={formState.name}
              onChange={(event) =>
                setFormState((current) => ({ ...current, name: event.target.value }))
              }
            />
            <select
              className="select-input"
              value={formState.category}
              onChange={(event) =>
                setFormState((current) => ({ ...current, category: event.target.value }))
              }
            >
              <option value="refreshments">Refreshments</option>
              <option value="wellness">Wellness</option>
              <option value="housekeeping">Housekeeping</option>
            </select>
            <textarea
              className="text-area"
              placeholder="Product description"
              required
              value={formState.description}
              onChange={(event) =>
                setFormState((current) => ({ ...current, description: event.target.value }))
              }
            />
            <input
              className="text-input"
              min="0.01"
              placeholder="Price"
              required
              step="0.01"
              type="number"
              value={formState.price}
              onChange={(event) =>
                setFormState((current) => ({ ...current, price: event.target.value }))
              }
            />
            <button className="primary-button" disabled={isSavingProduct} type="submit">
              {isSavingProduct ? "Saving..." : "Save product"}
            </button>
          </form>

          <div className="product-grid admin-product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-card-top">
                  <div className="product-badge">{product.category}</div>
                  <span className={`status-pill ${product.is_active ? "status-confirmed" : "status-muted"}`}>
                    {product.is_active ? "Active" : "Hidden"}
                  </span>
                </div>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className="product-footer">
                  <strong>${Number(product.price).toFixed(2)}</strong>
                  <span className="product-tagline">Catalog item</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="card admin-section-card">
          <div className="section-header compact">
            <div>
              <h2>Recent orders</h2>
              <p>Latest rows from the Supabase `orders` table.</p>
            </div>
            <button className="secondary-button" onClick={onRefreshOrders} type="button">
              Refresh
            </button>
          </div>

          <div className="stack-list">
            {orders.length === 0 ? (
              <div className="empty-state compact-empty-state">
                <h3>No orders yet.</h3>
                <p>New customer orders will appear here as soon as they are submitted.</p>
              </div>
            ) : null}
            {orders.map((order) => (
              <button
                className="order-card order-card-button"
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                type="button"
              >
                <div className="order-header">
                  <strong>{getCustomerName(order)}</strong>
                  <span className={`status-pill status-${order.status}`}>{order.status}</span>
                </div>
                <p>{getAddressNote(order)} | {order.deliveryWindow || order.delivery_window}</p>
                <div className="order-footer">
                  <span>{order.mobile_number || "No mobile number"}</span>
                  <strong>${Number(order.total).toFixed(2)}</strong>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {selectedOrder ? (
        <div className="modal-backdrop" onClick={() => setSelectedOrderId(null)} role="presentation">
          <div
            aria-modal="true"
            className="modal-shell order-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <section className="card">
              <div className="section-header">
                <div>
                  <span className="eyebrow">Order details</span>
                  <h2>{getCustomerName(selectedOrder)}</h2>
                  <p>Placed {formatDateTime(selectedOrder.created_at)}</p>
                </div>
                <button className="secondary-button" onClick={() => setSelectedOrderId(null)} type="button">
                  Close
                </button>
              </div>

              <div className="order-detail-grid">
                <div className="order-detail-card">
                  <span className="field-label">Mobile number</span>
                  <strong>{selectedOrder.mobile_number || "Not provided"}</strong>
                </div>
                <div className="order-detail-card">
                  <span className="field-label">Address / note</span>
                  <strong>{getAddressNote(selectedOrder)}</strong>
                </div>
                <div className="order-detail-card">
                  <span className="field-label">Delivery window</span>
                  <strong>{selectedOrder.deliveryWindow || selectedOrder.delivery_window}</strong>
                </div>
                <div className="order-detail-card">
                  <span className="field-label">Status</span>
                  <strong>{selectedOrder.status}</strong>
                </div>
              </div>

              <div className="order-detail-block">
                <h3>Items</h3>
                <div className="stack-list">
                  {(selectedOrder.items || []).map((item, index) => (
                    <div className="order-item-row" key={`${item.product_id || item.name}-${index}`}>
                      <div>
                        <strong>{item.name}</strong>
                        <p>
                          {item.quantity} x ${Number(item.unit_price).toFixed(2)}
                        </p>
                      </div>
                      <strong>${Number(item.line_total).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="order-detail-block">
                <h3>Customer notes</h3>
                <p>{selectedOrder.notes || "No special instructions."}</p>
              </div>

              <div className="summary-box cart-summary-box">
                <div>
                  <span>Subtotal</span>
                  <strong>${Number(selectedOrder.subtotal || 0).toFixed(2)}</strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong>${Number(selectedOrder.total).toFixed(2)}</strong>
                </div>
              </div>

              <div className="order-modal-actions">
                <button className="secondary-button" onClick={() => setSelectedOrderId(null)} type="button">
                  Close
                </button>
                <button
                  className="primary-button"
                  disabled={selectedOrder.status === "confirmed" || isUpdatingOrder}
                  onClick={handleAcceptOrder}
                  type="button"
                >
                  {isUpdatingOrder
                    ? "Updating..."
                    : selectedOrder.status === "confirmed"
                      ? "Order accepted"
                      : "Accept order"}
                </button>
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </>
  );
}
