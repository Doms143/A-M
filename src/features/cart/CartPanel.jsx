export function CartPanel({ cart, summary, onUpdateQuantity }) {
  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <section className="card cart-card">
      <div className="section-header compact">
        <div>
          <h2>Cart</h2>
          <p>Review quantities before placing the order.</p>
        </div>
        <span>{totalUnits} unit{totalUnits === 1 ? "" : "s"}</span>
      </div>

      {cart.length === 0 ? (
        <div className="empty-state compact-empty-state">
          <h3>Your cart is empty.</h3>
          <p>Add a few essentials from the catalog to start your order.</p>
        </div>
      ) : null}

      <div className="stack-list">
        {cart.map((item) => (
          <div className="cart-row cart-item-card" key={item.id}>
            <div className="cart-copy">
              <strong>{item.name}</strong>
              <p>${item.price.toFixed(2)} each</p>
            </div>
            <div className="quantity-control">
              <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} type="button">-</button>
              <span>{item.quantity}</span>
              <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} type="button">+</button>
            </div>
            <strong className="cart-line-total">${(item.price * item.quantity).toFixed(2)}</strong>
          </div>
        ))}
      </div>

      <div className="summary-box cart-summary-box">
        <div>
          <span>Subtotal</span>
          <strong>${summary.subtotal.toFixed(2)}</strong>
        </div>
        <div>
          <span>Total</span>
          <strong>${summary.total.toFixed(2)}</strong>
        </div>
      </div>
    </section>
  );
}
