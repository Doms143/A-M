import { AdminPanel } from "./AdminPanel";

export function AdminDashboard({
  adminAccount,
  isDeletingProduct,
  isSavingProduct,
  onCreateProduct,
  onCancelOrder,
  onDeleteProduct,
  onSignOut,
  onUpdateOrderStatus,
  onViewStore,
  isUpdatingOrder,
  orders,
  products
}) {
  const totalOrders = orders.length;
  const activeProducts = products.filter((product) => product.is_active).length;

  return (
    <div className="page-shell">
      <nav className="navbar-header">
        <span className="navbar-brand">A&M Online Grocery Store</span>
        <div className="navbar-actions">
          <button className="secondary-button" onClick={onViewStore} type="button">
            <span className="desktop-only">Storefront</span>
            <span className="mobile-only">Store</span>
          </button>
          <button className="tertiary-button" onClick={onSignOut} type="button">
            <span className="desktop-only">Sign out</span>
            <span className="mobile-only">Logout</span>
          </button>
        </div>
      </nav>

      <header className="hero hero-compact admin-hero">
        <div className="hero-copy">
          <span className="eyebrow">Admin dashboard</span>
          <h1>Catalog and order controls.</h1>
          <p>
            Manage online grocery products and inspect recent orders straight from Supabase.
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

      <AdminPanel
        isDeletingProduct={isDeletingProduct}
        isUpdatingOrder={isUpdatingOrder}
        isSavingProduct={isSavingProduct}
        onCancelOrder={onCancelOrder}
        onCreateProduct={onCreateProduct}
        onDeleteProduct={onDeleteProduct}
        onUpdateOrderStatus={onUpdateOrderStatus}
        orders={orders}
        products={products}
      />
    </div>
  );
}
