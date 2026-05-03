import { useEffect, useRef, useState } from "react";

const pesoSign = "\u20b1";

function getPricingUnitLabel(pricingUnit) {
  return pricingUnit === "kilogram" ? "per kg" : "each";
}

export function CartPanel({ cart, maxQuantity = 20, summary, onUpdateQuantity }) {
  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCardRef = useRef(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [summaryMode, setSummaryMode] = useState("floating");

  function openCartSheet() {
    setIsSheetOpen(true);
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 980px)");

    function updateDockedState() {
      if (!mediaQuery.matches || !cartCardRef.current) {
        setSummaryMode("hidden");
        return;
      }

      const rect = cartCardRef.current.getBoundingClientRect();
      const cartTop = rect.top + window.scrollY;
      const cartBottom = cartTop + rect.height;
      const viewportTop = window.scrollY;
      const viewportBottom = viewportTop + window.innerHeight;

      if (viewportBottom < cartTop + 120) {
        setSummaryMode("floating");
        return;
      }

      if (viewportTop <= cartBottom - 80) {
        setSummaryMode("docked");
        return;
      }

      setSummaryMode("hidden");
    }

    updateDockedState();
    window.addEventListener("scroll", updateDockedState, { passive: true });
    window.addEventListener("resize", updateDockedState);

    return () => {
      window.removeEventListener("scroll", updateDockedState);
      window.removeEventListener("resize", updateDockedState);
    };
  }, []);

  useEffect(() => {
    if (!isSheetOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isSheetOpen]);

  function renderCartContent({ isSheet = false } = {}) {
    return (
      <>
        <div className="section-header compact">
          <div>
            <h2>Cart</h2>
            <p>Review quantities before placing the order.</p>
          </div>
          <span>{totalUnits} item{totalUnits === 1 ? "" : "s"}</span>
        </div>

        {cart.length === 0 ? (
          <div className="empty-state compact-empty-state">
            <h3>Your cart is empty.</h3>
            <p>Add a few essentials from the catalog to start your order.</p>
          </div>
        ) : null}

        <div className={`stack-list cart-items-list ${isSheet ? "cart-items-list-sheet" : ""}`}>
          {cart.map((item) => {
            const itemLimit = Math.min(maxQuantity, Number(item.stock_quantity ?? maxQuantity));
            return (
              <div className="cart-row cart-item-card" key={item.id}>
                <div className="cart-copy">
                  <strong>{item.name}</strong>
                  <p>{pesoSign}{item.price.toFixed(2)} {getPricingUnitLabel(item.pricing_unit)}</p>
                  {item.quantity >= itemLimit ? (
                    <span className="cart-limit-note">Limit {itemLimit} available</span>
                  ) : null}
                </div>
                <div className="quantity-control">
                  <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} type="button">-</button>
                  <span>{item.quantity}</span>
                  <button
                    disabled={item.quantity >= itemLimit}
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    type="button"
                  >
                    +
                  </button>
                </div>
                <strong className="cart-line-total">{pesoSign}{(item.price * item.quantity).toFixed(2)}</strong>
              </div>
            );
          })}
        </div>

        <div className="summary-box cart-summary-box">
          <div>
            <span>Subtotal</span>
            <strong>{pesoSign}{summary.subtotal.toFixed(2)}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>{pesoSign}{summary.total.toFixed(2)}</strong>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <section
        className={`card cart-card cart-card-sticky ${summaryMode === "docked" ? "cart-card-summary-docked" : "cart-card-summary-floating"}`}
        ref={cartCardRef}
      >
        {renderCartContent()}

        {summaryMode === "docked" ? (
          <div className="mobile-cart-summary mobile-cart-summary-docked">
            <div className="mobile-cart-summary-copy">
              <strong>{totalUnits} item{totalUnits === 1 ? "" : "s"}</strong>
              <span>
                <strong className="mobile-cart-summary-copy-total">Total {pesoSign}{summary.total.toFixed(2)}</strong>
              </span>
            </div>
          </div>
        ) : null}
      </section>

      {summaryMode === "floating" ? (
        <button
          aria-label={`View cart, ${totalUnits} item${totalUnits === 1 ? "" : "s"}, total ${pesoSign}${summary.total.toFixed(2)}`}
          className="mobile-cart-summary mobile-cart-summary-floating"
          onClick={openCartSheet}
          type="button"
        >
          <div className="mobile-cart-bubble-icon" aria-hidden="true">
            <span>Cart</span>
            <strong>{totalUnits}</strong>
          </div>
          <div className="mobile-cart-summary-copy mobile-cart-bubble-copy">
            <strong>{totalUnits} item{totalUnits === 1 ? "" : "s"}</strong>
            <span>
              <strong className="mobile-cart-summary-copy-total">Total {pesoSign}{summary.total.toFixed(2)}</strong>
            </span>
          </div>
        </button>
      ) : null}

      {isSheetOpen ? (
        <div className="cart-sheet-backdrop" onClick={() => setIsSheetOpen(false)} role="presentation">
          <section
            aria-modal="true"
            className="cart-sheet"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="cart-sheet-handle" aria-hidden="true" />
            <button className="tertiary-button cart-sheet-close" onClick={() => setIsSheetOpen(false)} type="button">
              Close
            </button>
            {renderCartContent({ isSheet: true })}
          </section>
        </div>
      ) : null}
    </>
  );
}
