const pesoSign = "\u20b1";

function getCustomerName(order) {
  return order.customer_name || order.guest_name || "Customer";
}

function getAddressNote(order) {
  return order.address_note || order.villa_number || "No address note";
}

function getOrderReference(orderId) {
  if (!orderId) {
    return "Pending";
  }

  return orderId.slice(0, 8).toUpperCase();
}

function getPricingUnitLabel(pricingUnit) {
  return pricingUnit === "kilogram" ? "per kg" : "each";
}

export function OrderConfirmation({ order }) {
  const items = order.items || [];

  return (
    <section className="card order-confirmation-card" aria-live="polite">
      <div className="section-header compact">
        <div>
          <span className="eyebrow">Order placed</span>
          <h2>Thanks, {getCustomerName(order)}.</h2>
          <p>Reference #{getOrderReference(order.id)} is now waiting for store review.</p>
        </div>
        <span className={`status-pill status-${order.status || "pending"}`}>
          {order.status || "pending"}
        </span>
      </div>

      <div className="order-confirmation-grid">
        <div className="order-detail-card">
          <span className="field-label">Mobile number</span>
          <strong>{order.mobile_number || "Not provided"}</strong>
        </div>
        <div className="order-detail-card">
          <span className="field-label">Address / pickup note</span>
          <strong>{getAddressNote(order)}</strong>
        </div>
        <div className="order-detail-card">
          <span className="field-label">Delivery window</span>
          <strong>{order.delivery_window || "within 30 minutes"}</strong>
        </div>
        <div className="order-detail-card">
          <span className="field-label">Total</span>
          <strong>{pesoSign}{Number(order.total || 0).toFixed(2)}</strong>
        </div>
      </div>

      <div className="order-detail-block order-confirmation-items">
        <h3>Items</h3>
        <div className="stack-list">
          {items.map((item, index) => (
            <div className="order-item-row" key={`${item.product_id || item.name}-${index}`}>
              <div>
                <strong>{item.name}</strong>
                <p>
                  {item.quantity} x {pesoSign}{Number(item.unit_price || 0).toFixed(2)} {getPricingUnitLabel(item.pricing_unit)}
                </p>
              </div>
              <strong>{pesoSign}{Number(item.line_total || 0).toFixed(2)}</strong>
            </div>
          ))}
        </div>
      </div>

      {order.notes ? (
        <div className="order-confirmation-note">
          <span className="field-label">Notes</span>
          <p>{order.notes}</p>
        </div>
      ) : null}
    </section>
  );
}
