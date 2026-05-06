import { useState } from "react";

const pesoSign = "\u20b1";
const mobileNumberPattern = /^09\d{9}$/;

function getCheckoutErrors(formState) {
  const customerName = formState.customerName.trim();
  const mobileNumber = formState.mobileNumber.trim();
  const addressNote = formState.addressNote.trim();
  const errors = {};

  if (customerName.length < 2) {
    errors.customerName = "Enter the customer's full name.";
  }

  if (!mobileNumberPattern.test(mobileNumber)) {
    errors.mobileNumber = "Use an 11-digit PH mobile number starting with 09.";
  }

  if (addressNote.length < 8) {
    errors.addressNote = "Add a clearer house number, street, purok, or landmark.";
  }

  return errors;
}

export function CheckoutPanel({ cart, isSubmitting, onSubmit, session, summary }) {
  const [formState, setFormState] = useState({
    customerName: "",
    mobileNumber: "",
    addressNote: "",
    deliveryWindow: "within 30 minutes",
    notes: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [isReviewingOrder, setIsReviewingOrder] = useState(false);

  const validationErrors = getCheckoutErrors(formState);
  const isFormValid = Object.keys(validationErrors).length === 0;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const checkoutStep = isReviewingOrder ? "review" : "cart";

  function updateField(field, value) {
    setFormState((current) => ({ ...current, [field]: value }));
    setIsReviewingOrder(false);
    setFormErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  }

  function markFieldTouched(field) {
    setTouchedFields((current) => ({ ...current, [field]: true }));
  }

  function getVisibleError(field) {
    return formErrors[field] || (touchedFields[field] ? validationErrors[field] : "");
  }

  async function submitOrder() {
    await onSubmit({
      customerName: formState.customerName.trim(),
      mobileNumber: formState.mobileNumber.trim(),
      addressNote: formState.addressNote.trim(),
      deliveryWindow: formState.deliveryWindow,
      notes: formState.notes.trim(),
      email: session?.user?.email || "customer@amgrocery.local",
      total: summary.total
    });
    setIsReviewingOrder(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (cart.length === 0) {
      return;
    }

    const nextErrors = getCheckoutErrors(formState);
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setIsReviewingOrder(false);
      return;
    }

    if (!isReviewingOrder) {
      setIsReviewingOrder(true);
      return;
    }

    await submitOrder();
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

      <div className="checkout-stepper" aria-label="Checkout progress">
        <button
          className={`checkout-step ${checkoutStep === "cart" ? "checkout-step-active" : "checkout-step-done"}`}
          disabled={!isReviewingOrder}
          onClick={() => setIsReviewingOrder(false)}
          type="button"
        >
          <strong>1</strong>
          Cart
        </button>
        <span className={`checkout-step ${checkoutStep === "review" ? "checkout-step-active" : ""}`}>
          <strong>2</strong>
          Review
        </span>
      </div>

      <form className="checkout-form" onSubmit={handleSubmit}>
        {!isReviewingOrder ? (
          <>
            <label className="field-block">
              <span className="field-label">Customer name</span>
              <input
                className="text-input"
                aria-invalid={Boolean(getVisibleError("customerName"))}
                placeholder="Enter full name"
                value={formState.customerName}
                onBlur={() => markFieldTouched("customerName")}
                onChange={(event) => updateField("customerName", event.target.value)}
                required
              />
              {getVisibleError("customerName") ? <span className="field-error">{getVisibleError("customerName")}</span> : null}
            </label>
            <label className="field-block">
              <span className="field-label">Mobile number</span>
              <input
                className="text-input"
                aria-invalid={Boolean(getVisibleError("mobileNumber"))}
                inputMode="numeric"
                maxLength={11}
                pattern="09[0-9]{9}"
                placeholder="09XXXXXXXXX"
                value={formState.mobileNumber}
                onBlur={() => markFieldTouched("mobileNumber")}
                onChange={(event) => updateField("mobileNumber", event.target.value.replace(/\D/g, "").slice(0, 11))}
                required
                type="tel"
              />
              {getVisibleError("mobileNumber") ? <span className="field-error">{getVisibleError("mobileNumber")}</span> : null}
            </label>
            <label className="field-block">
              <span className="field-label">Address or pickup note</span>
              <input
                className="text-input"
                aria-invalid={Boolean(getVisibleError("addressNote"))}
                placeholder="House number, purok, street, or landmark"
                value={formState.addressNote}
                onBlur={() => markFieldTouched("addressNote")}
                onChange={(event) => updateField("addressNote", event.target.value)}
                required
              />
              {getVisibleError("addressNote") ? <span className="field-error">{getVisibleError("addressNote")}</span> : null}
            </label>
            <label className="field-block">
              <span className="field-label">Delivery window</span>
              <select
                className="select-input"
                value={formState.deliveryWindow}
                onChange={(event) => updateField("deliveryWindow", event.target.value)}
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
                onChange={(event) => updateField("notes", event.target.value)}
              />
            </label>
            <div className="checkout-note">
              <span className="status-pill status-confirmed">Order total</span>
              <strong>{pesoSign}{summary.total.toFixed(2)}</strong>
            </div>
          </>
        ) : (
          <div className="checkout-review-card" aria-live="polite">
            <div className="checkout-review-header">
              <div>
                <span className="eyebrow">Review order</span>
                <h3>Confirm before sending</h3>
              </div>
              <button className="checkout-edit-button" onClick={() => setIsReviewingOrder(false)} type="button">
                Back to edit
              </button>
            </div>

            <div className="checkout-review-grid">
              <div>
                <span className="field-label">Customer</span>
                <strong>{formState.customerName.trim()}</strong>
              </div>
              <div>
                <span className="field-label">Mobile</span>
                <strong>{formState.mobileNumber.trim()}</strong>
              </div>
              <div>
                <span className="field-label">Address / pickup note</span>
                <strong>{formState.addressNote.trim()}</strong>
              </div>
              <div>
                <span className="field-label">Delivery window</span>
                <strong>{formState.deliveryWindow}</strong>
              </div>
            </div>

            <div className="checkout-review-items">
              {cart.map((item) => (
                <div className="checkout-review-row" key={item.id}>
                  <span>{item.quantity} x {item.name}</span>
                  <strong>{pesoSign}{(item.price * item.quantity).toFixed(2)}</strong>
                </div>
              ))}
            </div>

            <div className="checkout-review-total">
              <span>{totalItems} item{totalItems === 1 ? "" : "s"} total</span>
              <strong>{pesoSign}{summary.total.toFixed(2)}</strong>
            </div>
          </div>
        )}

        <button className="primary-button" disabled={cart.length === 0 || isSubmitting || !isFormValid} type="submit">
          {isSubmitting
            ? "Processing..."
            : isReviewingOrder
              ? `Confirm order - ${pesoSign}${summary.total.toFixed(2)}`
              : `Review order - ${pesoSign}${summary.total.toFixed(2)}`}
        </button>
      </form>
    </section>
  );
}
