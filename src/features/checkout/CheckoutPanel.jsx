import { useState } from "react";

export function CheckoutPanel({ cart, isSubmitting, onSubmit, session, summary }) {
  const [formState, setFormState] = useState({
    customerName: "",
    mobileNumber: "",
    addressNote: "",
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
      email: session?.user?.email || "customer@sarisari.local",
      total: summary.total
    });
  }

  return (
    <section className="card checkout-card">
      <div className="section-header compact">
        <div>
          <h2>Checkout</h2>
          <p>Tell the store where and when to prepare this order.</p>
        </div>
        <span>{session ? "Admin signed in" : "Customer order"}</span>
      </div>

      <form className="checkout-form" onSubmit={handleSubmit}>
        <label className="field-block">
          <span className="field-label">Customer name</span>
          <input
            className="text-input"
            placeholder="Enter full name"
            value={formState.customerName}
            onChange={(event) =>
              setFormState((current) => ({ ...current, customerName: event.target.value }))
            }
            required
          />
        </label>
        <label className="field-block">
          <span className="field-label">Mobile number</span>
          <input
            className="text-input"
            placeholder="09XXXXXXXXX"
            value={formState.mobileNumber}
            onChange={(event) =>
              setFormState((current) => ({ ...current, mobileNumber: event.target.value }))
            }
            required
            type="tel"
          />
        </label>
        <label className="field-block">
          <span className="field-label">Address or pickup note</span>
          <input
            className="text-input"
            placeholder="House number, purok, street, or landmark"
            value={formState.addressNote}
            onChange={(event) =>
              setFormState((current) => ({ ...current, addressNote: event.target.value }))
            }
            required
          />
        </label>
        <label className="field-block">
          <span className="field-label">Delivery window</span>
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
        </label>
        <label className="field-block">
          <span className="field-label">Special instructions</span>
          <textarea
            className="text-area"
            placeholder="Optional notes for packaging, substitutions, or delivery"
            value={formState.notes}
            onChange={(event) =>
              setFormState((current) => ({ ...current, notes: event.target.value }))
            }
          />
        </label>
        <div className="checkout-note">
          <span className="status-pill status-confirmed">Order total</span>
          <strong>${summary.total.toFixed(2)}</strong>
        </div>
        <button className="primary-button" disabled={cart.length === 0 || isSubmitting} type="submit">
          {isSubmitting ? "Processing..." : `Place order - $${summary.total.toFixed(2)}`}
        </button>
      </form>
    </section>
  );
}
