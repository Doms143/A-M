import { useEffect, useMemo, useState } from "react";
import { AdminLoginPanel } from "../features/admin/AdminLoginPanel";
import { AdminDashboard } from "../features/admin/AdminDashboard";
import { CatalogPanel } from "../features/catalog/CatalogPanel";
import { CartPanel } from "../features/cart/CartPanel";
import { CheckoutPanel } from "../features/checkout/CheckoutPanel";
import {
  getCatalog,
  createOrder,
  createCheckoutSession,
  getAdminAccount,
  createAdminProduct,
  getAdminOrders,
  getAdminProducts,
  updateAdminOrder
} from "../shared/api/shopApi";
import { isSupabaseConfigured, supabase } from "../shared/supabase/client";

const initialFilters = {
  category: "all",
  query: ""
};

function getRoute() {
  const hash = window.location.hash.replace(/^#/, "");
  if (hash === "/admin" || hash === "admin") {
    return "admin";
  }
  if (hash === "/signin" || hash === "signin") {
    return "signin";
  }
  return "shop";
}

export default function App() {
  const [route, setRoute] = useState(getRoute);
  const [session, setSession] = useState(null);
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [adminProducts, setAdminProducts] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);
  const [adminAccount, setAdminAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isAdminReady, setIsAdminReady] = useState(false);
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

      const [{ products: catalog }] = await Promise.all([getCatalog()]);

      if (isMounted) {
        setProducts(catalog);
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
    function syncRoute() {
      setRoute(getRoute());
    }

    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined;
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setIsSessionChecked(true);
      setIsAdminReady(false);
      
      if (nextSession?.access_token) {
        try {
          const accountResponse = await getAdminAccount(nextSession.access_token);
          setAdminAccount(accountResponse.account ?? null);
        } catch {
          setAdminAccount(null);
        }
      } else {
        setAdminAccount(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  function navigate(nextRoute) {
    window.location.hash = nextRoute === "shop" ? "/" : `/${nextRoute}`;
    setRoute(nextRoute);
  }

  useEffect(() => {
    if (!isSessionChecked) {
      return;
    }
    
    if (route === "admin" && !session) {
      setIsAdminLoginOpen(true);
      navigate("shop");
    }
  }, [route, session, isSessionChecked]);

  useEffect(() => {
    if (route === "admin" && session?.access_token && !isAdminReady && adminAccount) {
      refreshAdminData(session.access_token).catch(() => {});
    }
  }, [route, session, isAdminReady, adminAccount]);

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
    return { subtotal, total: subtotal };
  }, [cart]);

  const cartUnits = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const categoryCount = useMemo(
    () => new Set(products.map((product) => product.category)).size,
    [products]
  );

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

  async function handleOrderSubmit(customerDetails) {
    setIsSubmitting(true);
    setError("");
    setCheckoutMessage("");

    try {
      const payload = {
        customerDetails,
        items: cart.map(({ id, quantity }) => ({ id, quantity }))
      };

      const orderResponse = await createOrder(payload, session?.access_token);
      const checkoutResponse = await createCheckoutSession(orderResponse.order, session?.access_token);
      setCart([]);
      setCheckoutMessage(checkoutResponse.message);
      refreshAdminOrders().catch(() => {});
    } catch (requestError) {
      setError(requestError.message || "Order submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSignIn() {
    setError("");
    navigate("signin");
  }

  async function handleAdminSignIn(credentials) {
    if (!supabase) {
      return;
    }

    setIsSigningIn(true);
    setError("");

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword(credentials);
      if (signInError) {
        throw signInError;
      }

      if (!data.session?.access_token) {
        throw new Error("Admin session was not created.");
      }

      await refreshAdminData(data.session.access_token);
      navigate("admin");
    } catch (requestError) {
      setError(requestError.message || "Admin sign-in failed.");
    } finally {
      setIsSigningIn(false);
    }
  }

  async function handleSignOut() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setAdminAccount(null);
    setIsAdminReady(false);
    navigate("shop");
  }

  async function refreshAdminOrders() {
    const response = await getAdminOrders(session?.access_token);
    setAdminOrders(response.orders ?? []);
  }

  async function refreshAdminData(accessToken = session?.access_token) {
    try {
      const [ordersResponse, productsResponse] = await Promise.all([
        getAdminOrders(accessToken),
        getAdminProducts(accessToken)
      ]);
      const accountResponse = await getAdminAccount(accessToken);
      setAdminOrders(ordersResponse.orders ?? []);
      setAdminProducts(productsResponse.products ?? []);
      setAdminAccount(accountResponse.account ?? null);
      setIsAdminReady(true);
      setError("");
    } catch (requestError) {
      setIsAdminReady(false);
      throw requestError;
    }
  }

  async function handleCreateProduct(payload) {
    setIsSavingProduct(true);
    setError("");

    try {
      await createAdminProduct(payload, session?.access_token);
      const [catalogResponse, adminProductResponse] = await Promise.all([
        getCatalog(),
        getAdminProducts(session?.access_token)
      ]);
      setProducts(catalogResponse.products ?? []);
      setAdminProducts(adminProductResponse.products ?? []);
    } catch (requestError) {
      setError(requestError.message || "Unable to save product.");
    } finally {
      setIsSavingProduct(false);
    }
  }

  async function handleAcceptOrder(orderId) {
    setIsUpdatingOrder(true);
    setError("");

    try {
      const response = await updateAdminOrder(
        orderId,
        { status: "confirmed" },
        session?.access_token
      );
      setAdminOrders((currentOrders) =>
        currentOrders.map((order) => (order.id === orderId ? response.order : order))
      );
    } catch (requestError) {
      setError(requestError.message || "Unable to accept order.");
      throw requestError;
    } finally {
      setIsUpdatingOrder(false);
    }
  }

  if (route === "signin") {
    return (
      <>
        <div className="page-shell">
          <nav className="navbar-header">
            <span className="navbar-brand">A&M Sari-Sari Store</span>
            <div className="navbar-actions">
              <button className="secondary-button" onClick={() => navigate("shop")} type="button">
                Back
              </button>
            </div>
          </nav>

          <div className="signin-container">
            {error ? <div className="banner banner-error">{error}</div> : null}
            <AdminLoginPanel
              isSigningIn={isSigningIn}
              onSubmit={handleAdminSignIn}
            />
          </div>
        </div>
      </>
    );
  }

  if (route === "admin" && session) {
    if (!isAdminReady) {
      return (
        <div className="page-shell">
          <header className="hero hero-compact admin-hero">
            <div className="hero-copy">
              <span className="eyebrow">Admin dashboard</span>
              <h1>Loading admin access.</h1>
              <p>Checking your account and loading inventory data.</p>
            </div>
            <div className="hero-actions">
              <button className="secondary-button" onClick={() => navigate("shop")} type="button">
                Storefront
              </button>
            </div>
          </header>

          {error ? <div className="banner banner-error">{error}</div> : null}

          <section className="card admin-login-card">
            <div className="section-header">
              <div>
                <h2>Preparing dashboard</h2>
                <p>Your admin data is loading now.</p>
              </div>
            </div>
          </section>
        </div>
      );
    }

    return (
      <>
        {error ? <div className="page-shell"><div className="banner banner-error">{error}</div></div> : null}
        <AdminDashboard
          adminAccount={adminAccount}
          isUpdatingOrder={isUpdatingOrder}
          isSavingProduct={isSavingProduct}
          onAcceptOrder={handleAcceptOrder}
          onCreateProduct={handleCreateProduct}
          onRefreshOrders={refreshAdminOrders}
          onSignOut={handleSignOut}
          onViewStore={() => navigate("shop")}
          orders={adminOrders}
          products={adminProducts}
        />
      </>
    );
  }

  return (
    <>
      <div className="page-shell">
        <nav className="navbar-header">
          <span className="navbar-brand">A&M Sari-Sari Store</span>
          <div className="navbar-actions">
            {!session && isSupabaseConfigured ? (
              <button className="primary-button" onClick={handleSignIn} type="button">
                Sign In
              </button>
            ) : null}
            {session && adminAccount ? (
              <button className="secondary-button" onClick={() => navigate("admin")} type="button">
                Dashboard
              </button>
            ) : null}
            {session ? (
              <button className="secondary-button" onClick={handleSignOut} type="button">
                Sign out
              </button>
            ) : null}
          </div>
        </nav>

        <header className="hero storefront-hero">
          <div className="hero-copy">
            <span className="eyebrow">A&M Sari-Sari Store</span>
            <h1>Neighborhood essentials, ready for fast ordering.</h1>
            <p>
              Browse daily snacks, drinks, canned goods, toiletries, and household basics
              in a cleaner checkout flow built for quick local orders.
            </p>
            <div className="hero-stat-row">
              <div className="hero-stat-chip">
                <strong>{products.length}</strong>
                <span>Available items</span>
              </div>
              <div className="hero-stat-chip">
                <strong>{categoryCount}</strong>
                <span>Core categories</span>
              </div>
              <div className="hero-stat-chip">
                <strong>{cartUnits}</strong>
                <span>Units in cart</span>
              </div>
            </div>
          </div>
          <aside className="hero-panel">
            <span className="hero-panel-kicker">Order overview</span>
            <h2>Simple storefront, faster checkout.</h2>
            <p>Search products, adjust quantities, and place orders from one screen without extra steps.</p>
          </aside>
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
          </aside>
        </main>
      </div>
    </>
  );
}
