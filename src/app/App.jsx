import { useEffect, useMemo, useState } from "react";
import { CatalogPanel } from "../features/catalog/CatalogPanel";
import { CartPanel } from "../features/cart/CartPanel";
import { OrderHistory } from "../features/orders/OrderHistory";
import { CheckoutPanel } from "../features/checkout/CheckoutPanel";
import { AuthPanel } from "../features/auth/AuthPanel";
import { getCatalog, getOrders, createOrder, createCheckoutSession } from "../shared/api/shopApi";
import { isSupabaseConfigured, supabase } from "../shared/supabase/client";

const initialFilters = {
  category: "all",
  query: ""
};

export default function App() {
  const [session, setSession] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      setIsLoading(true);

      const activeSession = isSupabaseConfigured
        ? (
            await supabase.auth.getSession()
          ).data.session
        : null;

      if (isMounted) {
        setSession(activeSession);
      }

      const [{ products: catalog }, userOrders] = await Promise.all([
        getCatalog(),
        getOrders(activeSession?.access_token)
      ]);

      if (isMounted) {
        setProducts(catalog);
        setOrders(userOrders.orders ?? []);
        setIsLoading(false);
      }
    }

    bootstrap().catch(() => {
      if (isMounted) {
        setError("Unable to load the storefront. Check your API and Supabase variables.");
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined;
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      const userOrders = await getOrders(nextSession?.access_token);
      setOrders(userOrders.orders ?? []);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryMatch =
        filters.category === "all" || product.category === filters.category;
      const queryMatch =
        !filters.query ||
        `${product.name} ${product.description}`
          .toLowerCase()
          .includes(filters.query.toLowerCase());
      return categoryMatch && queryMatch;
    });
  }, [filters, products]);

  const cartSummary = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const serviceFee = subtotal * 0.06;
    const total = subtotal + serviceFee;
    return { subtotal, serviceFee, total };
  }, [cart]);

  function addToCart(product) {
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.id === product.id);
      if (existing) {
        return currentCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });
  }

  function updateQuantity(productId, nextQuantity) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId ? { ...item, quantity: Math.max(0, nextQuantity) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  async function handleOrderSubmit(guestDetails) {
    setIsSubmitting(true);
    setError("");
    setCheckoutMessage("");

    try {
      const payload = {
        guestDetails,
        items: cart.map(({ id, quantity }) => ({ id, quantity }))
      };

      const orderResponse = await createOrder(payload, session?.access_token);
      const checkoutResponse = await createCheckoutSession(orderResponse.order, session?.access_token);

      setOrders((current) => [orderResponse.order, ...current]);
      setCart([]);
      setCheckoutMessage(checkoutResponse.message);
    } catch (requestError) {
      setError(requestError.message || "Order submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-shell">
      <header className="hero">
        <div>
          <span className="eyebrow">Goods Ordering Website</span>
          <h1>Fast resort supply ordering for hospitality teams.</h1>
          <p>
            A mobile-friendly storefront for guests and staff aged 20-40 to browse,
            filter, order, and track goods without leaving the resort experience.
          </p>
        </div>
        <AuthPanel session={session} />
      </header>

      {error ? <div className="banner banner-error">{error}</div> : null}
      {checkoutMessage ? <div className="banner banner-success">{checkoutMessage}</div> : null}

      <main className="dashboard-grid">
        <CatalogPanel
          filters={filters}
          isLoading={isLoading}
          products={filteredProducts}
          onAddToCart={addToCart}
          onFiltersChange={setFilters}
        />
        <aside className="sidebar-stack">
          <CartPanel
            cart={cart}
            summary={cartSummary}
            onUpdateQuantity={updateQuantity}
          />
          <CheckoutPanel
            cart={cart}
            isSubmitting={isSubmitting}
            session={session}
            summary={cartSummary}
            onSubmit={handleOrderSubmit}
          />
          <OrderHistory orders={orders} />
        </aside>
      </main>
    </div>
  );
}
