const pesoSign = "\u20b1";

function ButtonIcon({ type }) {
  const paths = {
    copy: "M8 8h10v10H8z M6 16H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1",
    repeat: "M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3",
    search: "M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm5.5-2 5 5",
    shop: "M6 7h12l-1 13H7L6 7Zm3 0a3 3 0 0 1 6 0"
  };

  return (
    <svg aria-hidden="true" className="button-icon" viewBox="0 0 24 24">
      <path d={paths[type]} />
    </svg>
  );
}

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

function formatDateTime(value) {
  if (!value) {
    return "Just now";
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

export function OrderConfirmation({ onContinueShopping, onRepeatOrder, onTrackOrder, order }) {
  const items = order.items || [];
  const reference = getOrderReference(order);
  const orderStatus = order.status || "pending";

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
          <p>Your order is saved. Keep the reference below for tracking and store follow-up.</p>
        </div>
        <span className={`status-pill status-${orderStatus}`}>
          {orderStatus}
        </span>
      </div>

      <div className="receipt-panel">
        <div className="receipt-reference">
          <span className="field-label">Order reference</span>
          <strong>#{reference}</strong>
          <p>Use this reference with {order.mobile_number || "your mobile number"} to check the latest status.</p>
        </div>
        <div className="receipt-total">
          <span className="field-label">Total</span>
          <strong>{pesoSign}{Number(order.total || 0).toFixed(2)}</strong>
          <span>{formatDateTime(order.created_at)}</span>
        </div>
      </div>

      <div className="order-reference-notice">
        <div>
          <span className="field-label">Next step</span>
          <strong>Waiting for store review</strong>
          <p>The store will review availability first, then update the order status.</p>
        </div>
        <div className="order-reference-actions">
          <button className="secondary-button" onClick={copyReference} type="button">
            <ButtonIcon type="copy" />
            Copy reference
          </button>
          {onTrackOrder ? (
            <button className="secondary-button" onClick={onTrackOrder} type="button">
              <ButtonIcon type="search" />
              Track order
            </button>
          ) : null}
          {onContinueShopping ? (
            <button className="secondary-button" onClick={onContinueShopping} type="button">
              <ButtonIcon type="shop" />
              Continue shopping
            </button>
          ) : null}
          {onRepeatOrder ? (
            <button className="primary-button" onClick={() => onRepeatOrder(order)} type="button">
              <ButtonIcon type="repeat" />
              Repeat order
            </button>
          ) : null}
        </div>
      </div>

      <div className="order-confirmation-grid">
        <div className="order-detail-card">
          <span className="field-label">Contact</span>
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
          <span className="field-label">Status</span>
          <strong className={`status-pill status-${orderStatus}`}>{orderStatus}</strong>
        </div>
      </div>

      <div className="order-detail-block order-confirmation-items">
        <h3>Items</h3>
        <div className="stack-list order-confirmation-items-list">
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
        <div className="receipt-status-flow" aria-label="Order status flow">
          {["pending", "accepted", "preparing", "ready"].map((status, index) => (
            <span className={index === 0 ? "receipt-status-step receipt-status-step-active" : "receipt-status-step"} key={status}>
              {status}
            </span>
          ))}
        </div>
        <p>Keep your phone available. The status page will update as the order moves through review, preparation, and pickup or delivery readiness.</p>
      </div>
    </section>
  );
}
