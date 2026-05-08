import { useEffect, useMemo, useRef, useState } from "react";
import { AdminLoginPanel } from "../features/admin/AdminLoginPanel";
import { AdminDashboard } from "../features/admin/AdminDashboard";
import { CatalogPanel } from "../features/catalog/CatalogPanel";
import { CartPanel } from "../features/cart/CartPanel";
import { CheckoutPanel } from "../features/checkout/CheckoutPanel";
import { OrderConfirmation } from "../features/checkout/OrderConfirmation";
import { OrderStatusLookup } from "../features/orders/OrderStatusLookup";
import {
  getCatalog,
  createOrder,
  createCheckoutSession,
  getOrderStatus,
  getAdminAccount,
  createAdminProduct,
  deleteAdminProduct,
  getAdminOrders,
  getAdminProducts,
  updateAdminOrder
} from "../shared/api/shopApi";
import { isSupabaseConfigured, supabase } from "../shared/supabase/client";

const initialFilters = {
  category: "all",
  query: ""
};

const ADMIN_CACHE_KEY = "am-admin-dashboard-cache";
const MAX_ITEM_QUANTITY = 20;

function readAdminCache() {
  try {
    const rawValue = window.sessionStorage.getItem(ADMIN_CACHE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

function writeAdminCache(snapshot) {
  try {
    window.sessionStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(snapshot));
  } catch {}
}

function clearAdminCache() {
  try {
    window.sessionStorage.removeItem(ADMIN_CACHE_KEY);
  } catch {}
}

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
  const cachedAdminState = readAdminCache();
  const [route, setRoute] = useState(getRoute);
  const [session, setSession] = useState(null);
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [catalogPage, setCatalogPage] = useState(1);
  const [adminProducts, setAdminProducts] = useState(cachedAdminState?.products ?? []);
  const [adminOrders, setAdminOrders] = useState(cachedAdminState?.orders ?? []);
  const [adminAccount, setAdminAccount] = useState(cachedAdminState?.account ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isAdminReady, setIsAdminReady] = useState(Boolean(cachedAdminState));
  const [error, setError] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [lastOrder, setLastOrder] = useState(null);
  const adminRefreshTokenRef = useRef("");
  const orderConfirmationRef = useRef(null);

  function syncAdminCache(nextAccount, nextOrders, nextProducts) {
    writeAdminCache({
      account: nextAccount,
      orders: nextOrders,
      products: nextProducts
    });
  }

  async function getAccessToken() {
    if (session?.access_token) {
      return session.access_token;
    }

    if (!supabase) {
      return "";
    }

    const {
      data: { session: nextSession }
    } = await supabase.auth.getSession();

    if (nextSession) {
      setSession(nextSession);
    }

    return nextSession?.access_token ?? "";
  }

  async function fetchAdminAccount(accessToken) {
    const accountResponse = await getAdminAccount(accessToken);
    const nextAccount = accountResponse.account ?? null;
    setAdminAccount(nextAccount);
    syncAdminCache(nextAccount, adminOrders, adminProducts);
    return nextAccount;
  }

  async function refreshAdminData(accessToken = session?.access_token, accountOverride = adminAccount) {
    const [ordersResponse, productsResponse] = await Promise.all([
      getAdminOrders(accessToken),
      getAdminProducts(accessToken)
    ]);
    const nextOrders = ordersResponse.orders ?? [];
    const nextProducts = productsResponse.products ?? [];

    setAdminOrders(nextOrders);
    setAdminProducts(nextProducts);
    setIsAdminReady(true);
    setError("");
    syncAdminCache(accountOverride, nextOrders, nextProducts);
  }

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      setIsLoading(true);

      const [activeSession, catalogResponse] = await Promise.all([
        isSupabaseConfigured
          ? supabase.auth.getSession().then(({ data }) => data.session)
          : Promise.resolve(null),
        getCatalog()
      ]);

      if (isMounted) {
        setSession(activeSession);
        setIsSessionChecked(true);
      }

      if (isMounted) {
        setProducts(catalogResponse.products ?? []);
        setIsLoading(false);
      }

      if (activeSession?.access_token) {
        fetchAdminAccount(activeSession.access_token).catch(() => {
          if (isMounted) {
            setAdminAccount(null);
          }
        });
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
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsSessionChecked(true);
      adminRefreshTokenRef.current = "";

      if (!nextSession?.access_token) {
        setAdminAccount(null);
        setAdminOrders([]);
        setAdminProducts([]);
        setIsAdminReady(false);
        clearAdminCache();
        return;
      }

      fetchAdminAccount(nextSession.access_token).catch(() => {
        setAdminAccount(null);
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.access_token || !adminAccount || route !== "admin") {
      return;
    }

    const refreshToken = `${route}:${session.access_token}`;
    if (adminRefreshTokenRef.current === refreshToken) {
      return;
    }

    adminRefreshTokenRef.current = refreshToken;
    refreshAdminData(session.access_token).catch(() => {
      adminRefreshTokenRef.current = "";
    });
  }, [route, session, adminAccount]);

  function navigate(nextRoute) {
    window.location.hash = nextRoute === "shop" ? "/" : `/${nextRoute}`;
    setRoute(nextRoute);
  }

  useEffect(() => {
    if (!isSessionChecked) {
      return;
    }
    
    if (route === "admin" && !session) {
      navigate("shop");
    }
  }, [route, session, isSessionChecked]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const categoryMatch =
          filters.category === "all" || product.category === filters.category;
        const queryMatch =
          !filters.query ||
          `${product.name} ${product.description}`
            .toLowerCase()
            .includes(filters.query.toLowerCase());
        return categoryMatch && queryMatch;
      })
      .sort((firstProduct, secondProduct) => {
        const firstIsOutOfStock = Number(firstProduct.stock_quantity ?? 0) <= 0;
        const secondIsOutOfStock = Number(secondProduct.stock_quantity ?? 0) <= 0;
        return Number(firstIsOutOfStock) - Number(secondIsOutOfStock);
      });
  }, [filters, products]);

  const catalogItemsPerPage = 6;

  const paginatedProducts = useMemo(() => {
    const start = (catalogPage - 1) * catalogItemsPerPage;
    return filteredProducts.slice(start, start + catalogItemsPerPage);
  }, [catalogPage, filteredProducts]);

  const catalogPageCount = Math.max(1, Math.ceil(filteredProducts.length / catalogItemsPerPage));

  useEffect(() => {
    setCatalogPage(1);
  }, [filters]);

  useEffect(() => {
    if (catalogPage > catalogPageCount) {
      setCatalogPage(catalogPageCount);
    }
  }, [catalogPage, catalogPageCount]);

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
    const availableStock = Number(product.stock_quantity ?? 0);
    const itemLimit = Math.min(MAX_ITEM_QUANTITY, availableStock);
    if (itemLimit <= 0) {
      return;
    }

    setLastOrder(null);
    setCartMessage(`${product.name} added to cart.`);
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.id === product.id);
      if (existing) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(itemLimit, item.quantity + 1) }
            : item
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });
  }

  useEffect(() => {
    if (!cartMessage) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setCartMessage("");
    }, 2200);

    return () => window.clearTimeout(timerId);
  }, [cartMessage]);

  useEffect(() => {
    if (!lastOrder) {
      return;
    }

    window.requestAnimationFrame(() => {
      orderConfirmationRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }, [lastOrder]);

  function updateQuantity(productId, nextQuantity) {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.id !== productId) {
            return item;
          }

          const availableStock = Number(item.stock_quantity ?? 0);
          const itemLimit = Math.min(MAX_ITEM_QUANTITY, availableStock);
          return { ...item, quantity: Math.min(itemLimit, Math.max(0, nextQuantity)) };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function clearCart() {
    setCart([]);
    setCartMessage("");
  }

  function scrollToCatalog() {
    document.querySelector(".catalog-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToOrderStatus() {
    document.querySelector(".order-status-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToCheckout() {
    document.querySelector(".checkout-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function repeatOrder(order) {
    const orderItems = order?.items || [];
    if (orderItems.length === 0) {
      return;
    }

    const nextCartItems = orderItems
      .map((item) => {
        const product = products.find((candidate) => candidate.id === item.product_id);
        if (!product) {
          return null;
        }

        const availableStock = Number(product.stock_quantity ?? 0);
        const itemLimit = Math.min(MAX_ITEM_QUANTITY, availableStock);
        const quantity = Math.min(itemLimit, Number(item.quantity || 0));
        if (quantity <= 0) {
          return null;
        }

        return { ...product, quantity };
      })
      .filter(Boolean);

    if (nextCartItems.length === 0) {
      setError("Unable to repeat this order because the items are unavailable or out of stock.");
      return;
    }

    setError("");
    setLastOrder(null);
    setCart(nextCartItems);
    window.requestAnimationFrame(() => {
      document.querySelector(".cart-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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
      const catalogResponse = await getCatalog();
      setCart([]);
      setProducts(catalogResponse.products ?? []);
      setLastOrder(orderResponse.order);
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

      const accountResponse = await getAdminAccount(data.session.access_token);
      const nextAccount = accountResponse.account ?? null;
      setAdminAccount(nextAccount);
      await refreshAdminData(data.session.access_token, nextAccount);
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
    setAdminOrders([]);
    setAdminProducts([]);
    setIsAdminReady(false);
    clearAdminCache();
    navigate("shop");
  }

  async function refreshAdminOrders() {
    const accessToken = await getAccessToken();
    const response = await getAdminOrders(accessToken);
    const nextOrders = response.orders ?? [];
    setAdminOrders(nextOrders);
    syncAdminCache(adminAccount, nextOrders, adminProducts);
  }

  async function handleCreateProduct(payload) {
    setIsSavingProduct(true);
    setError("");

    try {
      const accessToken = await getAccessToken();
      await createAdminProduct(payload, accessToken);
      const [catalogResponse, adminProductResponse] = await Promise.all([
        getCatalog(),
        getAdminProducts(accessToken)
      ]);
      setProducts(catalogResponse.products ?? []);
      const nextProducts = adminProductResponse.products ?? [];
      setAdminProducts(nextProducts);
      syncAdminCache(adminAccount, adminOrders, nextProducts);
    } catch (requestError) {
      setError(requestError.message || "Unable to save product.");
    } finally {
      setIsSavingProduct(false);
    }
  }

  async function handleDeleteProduct(productId) {
    setIsDeletingProduct(true);
    setError("");

    try {
      const accessToken = await getAccessToken();
      await deleteAdminProduct(productId, accessToken);
      const [catalogResponse, adminProductResponse] = await Promise.all([
        getCatalog(),
        getAdminProducts(accessToken)
      ]);
      setProducts(catalogResponse.products ?? []);
      const nextProducts = adminProductResponse.products ?? [];
      setAdminProducts(nextProducts);
      syncAdminCache(adminAccount, adminOrders, nextProducts);
    } catch (requestError) {
      setError(requestError.message || "Unable to delete product.");
      throw requestError;
    } finally {
      setIsDeletingProduct(false);
    }
  }

  async function handleCancelOrder(orderId) {
    return handleOrderStatusUpdate(orderId, "cancelled", "Unable to cancel order.");
  }

  async function handleOrderStatusUpdate(orderId, status, fallbackMessage) {
    setIsUpdatingOrder(true);
    setError("");

    try {
      const accessToken = await getAccessToken();
      const response = await updateAdminOrder(
        orderId,
        { status },
        accessToken
      );
      setAdminOrders((currentOrders) => {
        const nextOrders = currentOrders.map((order) =>
          order.id === orderId ? response.order : order
        );
        syncAdminCache(adminAccount, nextOrders, adminProducts);
        return nextOrders;
      });
    } catch (requestError) {
      setError(requestError.message || fallbackMessage);
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
            <span className="navbar-brand">A&M Online Grocery Store</span>
            <div className="navbar-actions">
              <button className="tertiary-button" onClick={() => navigate("shop")} type="button">
                Back
              </button>
            </div>
          </nav>

          <div className="signin-container">
            <AdminLoginPanel
              error={error}
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
              <button className="tertiary-button" onClick={() => navigate("shop")} type="button">
                Storefront
              </button>
            </div>
          </header>

          {error ? <div className="banner banner-error">{error}</div> : null}

          <section className="card admin-login-card admin-loading-card" aria-busy="true">
            <div className="section-header">
              <div>
                <h2>Preparing dashboard</h2>
                <p>Your admin data is loading now.</p>
              </div>
            </div>
            <div className="admin-loading-skeleton" aria-hidden="true">
              <div className="admin-loading-main">
                <span className="skeleton-line skeleton-line-title" />
                <span className="skeleton-line" />
                <span className="skeleton-line skeleton-line-short" />
                <div className="admin-loading-stats">
                  <span className="skeleton-stat" />
                  <span className="skeleton-stat" />
                  <span className="skeleton-stat" />
                </div>
              </div>
              <div className="admin-loading-list">
                {Array.from({ length: 3 }, (_, index) => (
                  <div className="cart-item-card skeleton-card" key={`admin-loading-${index}`}>
                    <span className="skeleton-line skeleton-line-title" />
                    <span className="skeleton-line" />
                  </div>
                ))}
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
          isDeletingProduct={isDeletingProduct}
          isUpdatingOrder={isUpdatingOrder}
          isSavingProduct={isSavingProduct}
          onCancelOrder={handleCancelOrder}
          onCreateProduct={handleCreateProduct}
          onDeleteProduct={handleDeleteProduct}
          onUpdateOrderStatus={handleOrderStatusUpdate}
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
          <span className="navbar-brand">A&M Online Grocery Store</span>
          <div className="navbar-actions">
            {!session && isSupabaseConfigured ? (
              <button className="primary-button" onClick={handleSignIn} type="button">
                <span className="desktop-only">Sign In</span>
                <span className="mobile-only">Login</span>
              </button>
            ) : null}
            {session && adminAccount ? (
              <button className="secondary-button" onClick={() => navigate("admin")} type="button">
                <span className="desktop-only">Dashboard</span>
                <span className="mobile-only">Admin</span>
              </button>
            ) : null}
            {session ? (
              <button className="tertiary-button" onClick={handleSignOut} type="button">
                <span className="desktop-only">Sign out</span>
                <span className="mobile-only">Logout</span>
              </button>
            ) : null}
          </div>
        </nav>

        <header className="hero storefront-hero">
          <div className="hero-copy">
            <span className="eyebrow">A&M Online Grocery Store</span>
            <h1>Neighborhood essentials, ready for fast ordering.</h1>
            <p>
              Browse groceries, snacks, drinks, canned goods, toiletries, and household basics
              in a cleaner checkout flow built for quick online orders.
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
          <div className="storefront-desktop-cart">
            <CartPanel
              cart={cart}
              maxQuantity={MAX_ITEM_QUANTITY}
              summary={cartSummary}
              onCheckout={scrollToCheckout}
              onClearCart={clearCart}
              onUpdateQuantity={updateQuantity}
            />
          </div>
        </header>

        {error ? <div className="banner banner-error">{error}</div> : null}
        {cartMessage ? <div className="banner banner-success cart-added-banner">{cartMessage}</div> : null}
        {checkoutMessage ? <div className="banner banner-success">{checkoutMessage}</div> : null}
        {lastOrder ? (
          <div ref={orderConfirmationRef}>
            <OrderConfirmation
              order={lastOrder}
              onContinueShopping={scrollToCatalog}
              onRepeatOrder={repeatOrder}
              onTrackOrder={scrollToOrderStatus}
            />
          </div>
        ) : null}
        <OrderStatusLookup
          initialOrder={lastOrder}
          onLookup={getOrderStatus}
          onRepeatOrder={repeatOrder}
        />

        <main className="dashboard-grid">
          <CatalogPanel
            filters={filters}
            isLoading={isLoading}
            page={catalogPage}
            pageCount={catalogPageCount}
            products={paginatedProducts}
            totalProducts={filteredProducts.length}
            onAddToCart={addToCart}
            onFiltersChange={setFilters}
            onPageChange={setCatalogPage}
          />
          <aside className="sidebar-stack">
            <div className="storefront-mobile-cart">
              <CartPanel
                cart={cart}
                maxQuantity={MAX_ITEM_QUANTITY}
                summary={cartSummary}
                onCheckout={scrollToCheckout}
                onClearCart={clearCart}
                onUpdateQuantity={updateQuantity}
              />
            </div>
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
