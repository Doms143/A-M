export function CartPanel({ cart, summary, onUpdateQuantity }) {
  return (
    <section className="card">
      <div className="section-header compact">
        <h2>Cart</h2>
        <span>{cart.length} items</span>
      </div>

      {cart.length === 0 ? <p>Your cart is empty.</p> : null}

      <div className="stack-list">
        {cart.map((item) => (
          <div className="cart-row" key={item.id}>
            <div>
              <strong>{item.name}</strong>
              <p>${item.price.toFixed(2)} each</p>
            </div>
            <div className="quantity-control">
              <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>+</button>
            </div>
          </div>
        ))}
      </div>

      <div className="summary-box">
        <div>
          <span>Subtotal</span>
          <strong>${summary.subtotal.toFixed(2)}</strong>
        </div>
        <div>
          <span>Service fee</span>
          <strong>${summary.serviceFee.toFixed(2)}</strong>
        </div>
        <div>
          <span>Total</span>
          <strong>${summary.total.toFixed(2)}</strong>
        </div>
      </div>
    </section>
  );
}
