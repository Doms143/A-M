const pesoSign = "\u20b1";

function getCompactOrderMeta(order) {
  return `${order.delivery_window || "No delivery window"} • ${order.address_note || order.villa_number || "No address note"}`;
}

export function OrderHistory({ orders }) {
  return (
    <section className="card">
      <div className="section-header compact">
        <h2>Recent orders</h2>
        <span>{orders.length}</span>
      </div>

      <div className="stack-list">
        {orders.length === 0 ? <p>No orders yet.</p> : null}
        {orders.map((order) => (
          <article className="order-card" key={order.id}>
            <div className="order-header">
              <strong>{order.customer_name || order.guest_name}</strong>
              <span className={`status-pill status-${order.status}`}>{order.status}</span>
            </div>
            <p className="order-summary">{getCompactOrderMeta(order)}</p>
            <div className="order-footer">
              <span>{order.mobile_number || "No mobile number"}</span>
              <strong>{pesoSign}{Number(order.total).toFixed(2)}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
