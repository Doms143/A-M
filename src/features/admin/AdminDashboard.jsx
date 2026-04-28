import { AdminPanel } from "./AdminPanel";

export function AdminDashboard({
  adminAccount,
  isSavingProduct,
  onCreateProduct,
  onAcceptOrder,
  onRefreshOrders,
  onSignOut,
  onViewStore,
  isUpdatingOrder,
  orders,
  products
}) {
  const totalOrders = orders.length;
  const activeProducts = products.filter((product) => product.is_active).length;
  const hiddenProducts = products.length - activeProducts;

  return (
    <div className="page-shell">
      <nav className="navbar-header">
        <span className="navbar-brand">A&M Sari-Sari Store</span>
        <div className="navbar-actions">
          <button className="secondary-button" onClick={onViewStore} type="button">
            Storefront
          </button>
          <button className="primary-button" onClick={onSignOut} type="button">
            Sign out
          </button>
        </div>
      </nav>

      <header className="hero hero-compact admin-hero">
        <div className="hero-copy">
          <span className="eyebrow">Admin dashboard</span>
          <h1>Catalog and order controls.</h1>
          <p>
            Manage sari-sari store products and inspect recent orders straight from Supabase.
            {adminAccount?.email ? ` Signed in as ${adminAccount.email}.` : ""}
          </p>
          <div className="hero-stat-row">
            <div className="hero-stat-chip">
              <strong>{activeProducts}</strong>
              <span>Active products</span>
            </div>
            <div className="hero-stat-chip">
              <strong>{totalOrders}</strong>
              <span>Orders tracked</span>
            </div>
          </div>
        </div>
      </header>

      <section className="admin-dashboard-summary">
        <article className="card stat-card">
          <span className="stat-label">Products</span>
          <strong className="stat-value">{products.length}</strong>
          <p>{activeProducts} active in the storefront catalog.</p>
        </article>
        <article className="card stat-card">
          <span className="stat-label">Hidden</span>
          <strong className="stat-value">{hiddenProducts}</strong>
          <p>Items currently kept out of the customer storefront.</p>
        </article>
        <article className="card stat-card">
          <span className="stat-label">Orders</span>
          <strong className="stat-value">{totalOrders}</strong>
          <p>Recent orders available for admin review.</p>
        </article>
      </section>

      <AdminPanel
        isUpdatingOrder={isUpdatingOrder}
        isSavingProduct={isSavingProduct}
        onAcceptOrder={onAcceptOrder}
        onCreateProduct={onCreateProduct}
        onRefreshOrders={onRefreshOrders}
        orders={orders}
        products={products}
      />
    </div>
  );
}
