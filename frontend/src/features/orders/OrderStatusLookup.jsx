import { useEffect, useState } from "react";

const pesoSign = "\u20b1";
const statusSteps = [
  {
    value: "pending",
    label: "Pending",
    description: "The store is reviewing your order."
  },
  {
    value: "accepted",
    label: "Accepted",
    description: "The store confirmed the order."
  },
  {
    value: "preparing",
    label: "Preparing",
    description: "Your items are being prepared."
  },
  {
    value: "ready",
    label: "Ready",
    description: "Your order is ready for pickup or delivery."
  },
  {
    value: "completed",
    label: "Completed",
    description: "The order has been finished."
  }
];

function getOrderReference(order) {
  if (order?.reference_code) {
    return order.reference_code;
  }

  if (!order?.id) {
    return "";
  }

  return order.id.slice(0, 8).toUpperCase();
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

export function OrderStatusLookup({ initialOrder, onLookup, onRepeatOrder }) {
  const [formState, setFormState] = useState({
    reference: getOrderReference(initialOrder),
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
      reference: getOrderReference(initialOrder),
      mobileNumber: initialOrder.mobile_number || ""
    });
  }, [initialOrder]);

  async function handleSubmit(event) {
    event.preventDefault();
    const reference = formState.reference.trim();
    const mobileNumber = formState.mobileNumber.trim();

    if (reference.length < 8 || !/^09\d{9}$/.test(mobileNumber)) {
      setMessage("Enter the order reference and the 09 mobile number used for the order.");
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

  function getStatusStepClass(status) {
    const currentIndex = statusSteps.findIndex((step) => step.value === lookupOrder?.status);
    const stepIndex = statusSteps.findIndex((step) => step.value === status);

    if (lookupOrder?.status === "cancelled") {
      return "tracking-step";
    }

    if (stepIndex >= 0 && currentIndex >= 0 && stepIndex < currentIndex) {
      return "tracking-step tracking-step-complete";
    }

    if (stepIndex >= 0 && currentIndex >= 0 && stepIndex === currentIndex) {
      return "tracking-step tracking-step-current";
    }

    return "tracking-step";
  }

  function getCurrentStatusMessage() {
    if (lookupOrder?.status === "cancelled") {
      return "This order was cancelled. Contact the store if you need help with the order.";
    }

    const currentStep = statusSteps.find((step) => step.value === lookupOrder?.status);
    return currentStep?.description || "Check again later for the latest order update.";
  }

  return (
    <section className="card order-status-card">
      <div className="section-header compact">
        <div>
          <h2>Track order</h2>
          <p>Check the latest status using your saved order reference and mobile number.</p>
        </div>
      </div>

      <div className="order-status-helper">
        <strong>Keep your reference after ordering.</strong>
        <p>It is the fastest way to check if your order is pending, accepted, preparing, ready, completed, or cancelled.</p>
      </div>

      <form className="order-status-form" onSubmit={handleSubmit}>
        <label className="field-block">
          <span className="field-label">Reference</span>
          <input
            className="text-input"
            maxLength={16}
            placeholder="AM-260430-A1B2"
            value={formState.reference}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                reference: event.target.value.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 16).toUpperCase()
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
        <>
          <div className="tracking-result-card">
            <div className="tracking-result-header">
              <div>
                <span className="field-label">Current status</span>
                <strong className={`status-pill status-${lookupOrder.status}`}>{lookupOrder.status}</strong>
              </div>
              <div className="tracking-reference">
                <span className="field-label">Reference</span>
                <strong>#{getOrderReference(lookupOrder)}</strong>
              </div>
            </div>

            <div className="tracking-flow">
              <div className="tracking-flow-header">
                <span className="field-label">Order flow</span>
                <strong>{getCurrentStatusMessage()}</strong>
              </div>
              <div className="tracking-steps" aria-label="Order progress">
                {statusSteps.map((status, index) => (
                  <span className={getStatusStepClass(status.value)} key={status.value}>
                    <span className="tracking-step-index">{index + 1}</span>
                    <span className="tracking-step-copy">
                      <strong>{status.label}</strong>
                      <small>{status.description}</small>
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="order-status-result">
              <div>
                <span className="field-label">Placed</span>
                <strong>{formatDateTime(lookupOrder.created_at)}</strong>
              </div>
              <div>
                <span className="field-label">Contact</span>
                <strong>{lookupOrder.mobile_number || formState.mobileNumber}</strong>
              </div>
              <div>
                <span className="field-label">Total</span>
                <strong>{pesoSign}{Number(lookupOrder.total || 0).toFixed(2)}</strong>
              </div>
            </div>
          </div>
          {onRepeatOrder ? (
            <div className="order-status-actions">
              <button className="primary-button" onClick={() => onRepeatOrder(lookupOrder)} type="button">
                Repeat this order
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
