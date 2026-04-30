import { useEffect, useState } from "react";

const pesoSign = "\u20b1";

function getOrderReference(orderId) {
  if (!orderId) {
    return "";
  }

  return orderId.slice(0, 8).toUpperCase();
}

function formatDateTime(value) {
  if (!value) {
    return "Unknown time";
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

export function OrderStatusLookup({ initialOrder, onLookup }) {
  const [formState, setFormState] = useState({
    reference: getOrderReference(initialOrder?.id),
    mobileNumber: initialOrder?.mobile_number || ""
  });
  const [lookupOrder, setLookupOrder] = useState(initialOrder || null);
  const [message, setMessage] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!initialOrder) {
      return;
    }

    setLookupOrder(initialOrder);
    setFormState({
      reference: getOrderReference(initialOrder.id),
      mobileNumber: initialOrder.mobile_number || ""
    });
  }, [initialOrder]);

  async function handleSubmit(event) {
    event.preventDefault();
    const reference = formState.reference.trim();
    const mobileNumber = formState.mobileNumber.trim();

    if (reference.length < 8 || !/^09\d{9}$/.test(mobileNumber)) {
      setMessage("Enter the 8-character reference and the 09 mobile number used for the order.");
      return;
    }

    setIsChecking(true);
    setMessage("");

    try {
      const response = await onLookup(reference, mobileNumber);
      setLookupOrder(response.order);
    } catch (error) {
      setLookupOrder(null);
      setMessage(error.message || "Order was not found.");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <section className="card order-status-card">
      <div className="section-header compact">
        <div>
          <h2>Track order</h2>
          <p>Check the latest status using your order reference and mobile number.</p>
        </div>
      </div>

      <form className="order-status-form" onSubmit={handleSubmit}>
        <label className="field-block">
          <span className="field-label">Reference</span>
          <input
            className="text-input"
            maxLength={8}
            placeholder="AB12CD34"
            value={formState.reference}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                reference: event.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()
              }))
            }
          />
        </label>
        <label className="field-block">
          <span className="field-label">Mobile number</span>
          <input
            className="text-input"
            inputMode="numeric"
            maxLength={11}
            placeholder="09XXXXXXXXX"
            value={formState.mobileNumber}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                mobileNumber: event.target.value.replace(/\D/g, "").slice(0, 11)
              }))
            }
            type="tel"
          />
        </label>
        <button className="secondary-button" disabled={isChecking} type="submit">
          {isChecking ? "Checking..." : "Check status"}
        </button>
      </form>

      {message ? <div className="banner banner-error order-status-message">{message}</div> : null}

      {lookupOrder ? (
        <div className="order-status-result">
          <div>
            <span className="field-label">Status</span>
            <strong className={`status-pill status-${lookupOrder.status}`}>{lookupOrder.status}</strong>
          </div>
          <div>
            <span className="field-label">Placed</span>
            <strong>{formatDateTime(lookupOrder.created_at)}</strong>
          </div>
          <div>
            <span className="field-label">Total</span>
            <strong>{pesoSign}{Number(lookupOrder.total || 0).toFixed(2)}</strong>
          </div>
        </div>
      ) : null}
    </section>
  );
}
