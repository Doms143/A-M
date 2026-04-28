import { useState } from "react";

export function CheckoutPanel({ cart, isSubmitting, onSubmit, session, summary }) {
  const [formState, setFormState] = useState({
    guestName: "",
    villaNumber: "",
    deliveryWindow: "within 30 minutes",
    notes: ""
  });

  async function handleSubmit(event) {
    event.preventDefault();
    if (cart.length === 0) {
      return;
    }

    await onSubmit({
      ...formState,
      email: session?.user?.email || "guest@resort.local",
      total: summary.total
    });
  }

  return (
    <section className="card">
      <div className="section-header compact">
        <h2>Checkout</h2>
        <span>{session ? "Authenticated" : "Guest mode"}</span>
      </div>

      <form className="checkout-form" onSubmit={handleSubmit}>
        <input
          className="text-input"
          placeholder="Guest or staff name"
          value={formState.guestName}
          onChange={(event) =>
            setFormState((current) => ({ ...current, guestName: event.target.value }))
          }
          required
        />
        <input
          className="text-input"
          placeholder="Villa / room number"
          value={formState.villaNumber}
          onChange={(event) =>
            setFormState((current) => ({ ...current, villaNumber: event.target.value }))
          }
          required
        />
        <select
          className="select-input"
          value={formState.deliveryWindow}
          onChange={(event) =>
            setFormState((current) => ({ ...current, deliveryWindow: event.target.value }))
          }
        >
          <option>within 30 minutes</option>
          <option>within 1 hour</option>
          <option>schedule for later</option>
        </select>
        <textarea
          className="text-area"
          placeholder="Special instructions"
          value={formState.notes}
          onChange={(event) =>
            setFormState((current) => ({ ...current, notes: event.target.value }))
          }
        />
        <button className="primary-button" disabled={cart.length === 0 || isSubmitting} type="submit">
          {isSubmitting ? "Processing..." : `Place order • $${summary.total.toFixed(2)}`}
        </button>
      </form>
    </section>
  );
}
