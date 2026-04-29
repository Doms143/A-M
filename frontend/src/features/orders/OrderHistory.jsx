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
            <p>{order.address_note || order.villa_number} | {order.delivery_window}</p>
            <p>Total: ${Number(order.total).toFixed(2)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
