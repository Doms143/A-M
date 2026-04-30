const pesoSign = "\u20b1";

function getCustomerName(order) {
  return order.customer_name || order.guest_name || "Customer";
}

function getAddressNote(order) {
  return order.address_note || order.villa_number || "No address note";
}

function getOrderReference(order) {
  if (order?.reference_code) {
    return order.reference_code;
  }

  if (!order?.id) {
    return "Pending";
  }

  return order.id.slice(0, 8).toUpperCase();
}

function getPricingUnitLabel(pricingUnit) {
  return pricingUnit === "kilogram" ? "per kg" : "each";
}

export function OrderConfirmation({ onRepeatOrder, order }) {
  const items = order.items || [];
  const reference = getOrderReference(order);

  async function copyReference() {
    if (!navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(reference);
  }

  return (
    <section className="card order-confirmation-card" aria-live="polite">
      <div className="section-header compact">
        <div>
          <span className="eyebrow">Order placed</span>
          <h2>Thanks, {getCustomerName(order)}.</h2>
          <p>Reference #{reference} is now waiting for store review.</p>
        </div>
        <span className={`status-pill status-${order.status || "pending"}`}>
          {order.status || "pending"}
        </span>
      </div>

      <div className="order-reference-notice">
        <div>
          <span className="field-label">Save this reference</span>
          <strong>#{reference}</strong>
          <p>Use this with your mobile number to track the order. The store may contact you through the mobile number you provided.</p>
        </div>
        <div className="order-reference-actions">
          <button className="secondary-button" onClick={copyReference} type="button">
            Copy reference
          </button>
          {onRepeatOrder ? (
            <button className="primary-button" onClick={() => onRepeatOrder(order)} type="button">
              Repeat order
            </button>
          ) : null}
        </div>
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

      <div className="order-next-steps">
        <span className="field-label">What happens next</span>
        <p>Keep your phone available. Your order stays pending until the store reviews it, then the status page will update when it is accepted or cancelled.</p>
      </div>
    </section>
  );
}
