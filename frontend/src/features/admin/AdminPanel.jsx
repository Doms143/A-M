import { useMemo, useState } from "react";

const initialProductForm = {
  id: "",
  name: "",
  category: "refreshments",
  description: "",
  price: "",
  pricingUnit: "piece",
  isActive: true,
  stockQuantity: 0
};

const defaultCategories = ["refreshments", "wellness", "housekeeping"];
const pesoSign = "\u20b1";
const orderTimelineLabels = {
  pending: "Order placed",
  accepted: "Order accepted",
  preparing: "Order preparing",
  ready: "Order ready",
  completed: "Order completed",
  cancelled: "Order cancelled"
};

const orderStatusOptions = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" }
];

const nextStatusByStatus = {
  pending: { value: "accepted", label: "Accept order" },
  accepted: { value: "preparing", label: "Start preparing" },
  preparing: { value: "ready", label: "Mark ready" },
  ready: { value: "completed", label: "Complete order" }
};

function getCustomerName(order) {
  return order.customer_name || order.guest_name || "Unknown customer";
}

function getAddressNote(order) {
  return order.address_note || order.villa_number || "No address note";
}

function getOrderReference(order) {
  if (order?.reference_code) {
    return order.reference_code;
  }

  if (!order?.id) {
    return "Pending";
  }

  return String(order.id).slice(0, 8).toUpperCase();
}

function getPricingUnitLabel(pricingUnit) {
  return pricingUnit === "kilogram" ? "per kg" : "each";
}

function getCompactDescription(description) {
  if (!description) {
    return "No description";
  }

  const normalized = description.trim();
  if (normalized.length <= 64) {
    return normalized;
  }

  return `${normalized.slice(0, 61).trimEnd()}...`;
}

function getCompactOrderMeta(order) {
  return `${getOrderReference(order)} | ${order.mobile_number || "No mobile"} | ${order.deliveryWindow || order.delivery_window || "No window"}`;
}

function formatDateTime(value) {
  if (!value) {
    return "Unknown";
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

function getOrderTimeline(order) {
  const history = Array.isArray(order.status_history) ? order.status_history : [];
  if (history.length > 0) {
    return history.map((event, index) => ({
      id: `${event.status || "event"}-${event.timestamp || index}`,
      label: event.label || orderTimelineLabels[event.status] || "Order updated",
      status: event.status || "updated",
      timestamp: event.timestamp || order.created_at
    }));
  }

  const timeline = [
    {
      id: "placed",
      label: orderTimelineLabels.pending,
      status: "pending",
      timestamp: order.created_at
    }
  ];

  if (order.status && order.status !== "pending") {
    timeline.push({
      id: order.status,
      label: orderTimelineLabels[order.status] || "Order updated",
      status: order.status,
      timestamp: order.status_updated_at || order.created_at
    });
  }

  return timeline;
}

function buildProductFormState(product) {
  return {
    id: product.id,
    name: product.name ?? "",
    category: product.category ?? "refreshments",
    description: product.description ?? "",
    price: product.price ?? "",
    pricingUnit: product.pricing_unit ?? "piece",
    isActive: product.is_active ?? true,
    stockQuantity: product.stock_quantity ?? 0
  };
}

export function AdminPanel({
  orders,
  products,
  onCreateProduct,
  onDeleteProduct,
  onCancelOrder,
  isSavingProduct,
  isDeletingProduct,
  isUpdatingOrder,
  onUpdateOrderStatus
}) {
  const [formState, setFormState] = useState(initialProductForm);
  const [categoryMode, setCategoryMode] = useState("preset");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [editFormState, setEditFormState] = useState(initialProductForm);
  const [editCategoryMode, setEditCategoryMode] = useState("preset");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [archivedOrdersPage, setArchivedOrdersPage] = useState(1);
  const [productsPage, setProductsPage] = useState(1);
  const [productQuery, setProductQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderQuery, setOrderQuery] = useState("");
  const [activeMobileSection, setActiveMobileSection] = useState("products");
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);

  const ordersPerPage = 5;
  const productsPerPage = 6;
  const archiveStatuses = new Set(["completed", "cancelled"]);

  const activeOrders = useMemo(
    () => orders.filter((order) => !archiveStatuses.has(order.status)),
    [orders]
  );

  const filteredActiveOrders = useMemo(() => {
    const normalizedQuery = orderQuery.trim().toLowerCase();

    return activeOrders.filter((order) => {
      const statusMatch =
        orderStatusFilter === "all" || order.status === orderStatusFilter;
      const queryMatch =
        !normalizedQuery ||
        `${getCustomerName(order)} ${getAddressNote(order)} ${order.mobile_number || ""} ${getOrderReference(order)} ${order.id || ""}`
          .toLowerCase()
          .includes(normalizedQuery);

      return statusMatch && queryMatch;
    });
  }, [activeOrders, orderQuery, orderStatusFilter]);

  const archivedOrders = useMemo(
    () => orders.filter((order) => archiveStatuses.has(order.status)),
    [orders]
  );

  const paginatedOrders = useMemo(() => {
    const start = (ordersPage - 1) * ordersPerPage;
    return filteredActiveOrders.slice(start, start + ordersPerPage);
  }, [filteredActiveOrders, ordersPage]);

  const paginatedArchivedOrders = useMemo(() => {
    const start = (archivedOrdersPage - 1) * ordersPerPage;
    return archivedOrders.slice(start, start + ordersPerPage);
  }, [archivedOrders, archivedOrdersPage]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = productQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return products;
    }

    return products.filter((product) =>
      `${product.name} ${product.description} ${product.category}`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [productQuery, products]);

  const paginatedProducts = useMemo(() => {
    const start = (productsPage - 1) * productsPerPage;
    return filteredProducts.slice(start, start + productsPerPage);
  }, [filteredProducts, productsPage]);

  const ordersPageCount = Math.ceil(filteredActiveOrders.length / ordersPerPage);
  const archivedOrdersPageCount = Math.ceil(archivedOrders.length / ordersPerPage);
  const productsPageCount = Math.ceil(filteredProducts.length / productsPerPage);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  );

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  function updateOrderStatusFilter(nextStatus) {
    setOrderStatusFilter(nextStatus);
    setOrdersPage(1);
  }

  function updateOrderQuery(nextQuery) {
    setOrderQuery(nextQuery);
    setOrdersPage(1);
  }

  function viewArchives() {
    setIsArchiveModalOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onCreateProduct(formState);
    setFormState(initialProductForm);
    setCategoryMode("preset");
    setIsCreateProductOpen(false);
  }

  function openProductModal(product) {
    const nextFormState = buildProductFormState(product);
    setSelectedProductId(product.id);
    setEditFormState(nextFormState);
    setEditCategoryMode(
      defaultCategories.includes(nextFormState.category) ? "preset" : "custom"
    );
  }

  function closeProductModal() {
    setSelectedProductId(null);
    setEditFormState(initialProductForm);
    setEditCategoryMode("preset");
  }

  async function handleSaveProductEdit(event) {
    event.preventDefault();
    await onCreateProduct(editFormState);
    closeProductModal();
  }

  async function handleDeleteSelectedProduct() {
    if (!selectedProduct) {
      return;
    }

    await onDeleteProduct(selectedProduct.id);
    closeProductModal();
  }

  async function handleNextOrderStatus() {
    if (!selectedOrder) {
      return;
    }

    const nextStatus = nextStatusByStatus[selectedOrder.status];
    if (!nextStatus) {
      return;
    }

    await onUpdateOrderStatus(
      selectedOrder.id,
      nextStatus.value,
      `Unable to update order to ${nextStatus.value}.`
    );
  }

  async function handleCancelOrder() {
    if (!selectedOrder) {
      return;
    }

    await onCancelOrder(selectedOrder.id);
    setSelectedOrderId(null);
  }

  function handlePrintOrder() {
    window.print();
  }

  return (
    <>
      <div className="mobile-admin-switcher" role="tablist" aria-label="Admin sections">
        <button
          aria-pressed={activeMobileSection === "products"}
          className={`secondary-button mobile-admin-switcher-button ${activeMobileSection === "products" ? "mobile-admin-switcher-button-active" : ""}`}
          onClick={() => setActiveMobileSection("products")}
          type="button"
        >
          Products
        </button>
        <button
          aria-pressed={activeMobileSection === "orders"}
          className={`secondary-button mobile-admin-switcher-button ${activeMobileSection === "orders" ? "mobile-admin-switcher-button-active" : ""}`}
          onClick={() => setActiveMobileSection("orders")}
          type="button"
        >
          Orders
        </button>
        <button
          aria-pressed={activeMobileSection === "archives"}
          className={`secondary-button mobile-admin-switcher-button ${activeMobileSection === "archives" ? "mobile-admin-switcher-button-active" : ""}`}
          onClick={viewArchives}
          type="button"
        >
          Archives
        </button>
      </div>

      <div className="admin-grid">
        <section
          className={`card admin-section-card ${activeMobileSection !== "products" ? "mobile-admin-section-hidden" : ""}`}
        >
          <div className="section-header compact">
            <div>
              <h2>Admin products</h2>
              <p>Manage inventory, search the catalog, and open a product when you need to edit it.</p>
            </div>
            <span>{products.length} items</span>
          </div>

          <div className="admin-toolbar">
            <button
              className={isCreateProductOpen ? "secondary-button" : "primary-button"}
              onClick={() => setIsCreateProductOpen((current) => !current)}
              type="button"
            >
              {isCreateProductOpen ? "Close form" : "Add product"}
            </button>
            <input
              className="text-input admin-search-input"
              placeholder="Search product"
              value={productQuery}
              onChange={(event) => {
                setProductQuery(event.target.value);
                setProductsPage(1);
              }}
            />
          </div>

          {isCreateProductOpen ? (
            <section className="admin-subcard admin-form-panel">
              <div className="section-header compact admin-subcard-header">
                <div>
                  <h2>New product</h2>
                  <p>Add one item at a time, then review it in the list below.</p>
                </div>
              </div>

              <form className="checkout-form" onSubmit={handleSubmit}>
                <input
                  className="text-input"
                  placeholder="Product name"
                  required
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, name: event.target.value }))
                  }
                />
                <select
                  className="select-input"
                  value={categoryMode === "custom" ? "other" : formState.category}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    if (nextValue === "other") {
                      setCategoryMode("custom");
                      setFormState((current) => ({ ...current, category: "" }));
                      return;
                    }

                    setCategoryMode("preset");
                    setFormState((current) => ({ ...current, category: nextValue }));
                  }}
                >
                  <option value="refreshments">Refreshments</option>
                  <option value="wellness">Wellness</option>
                  <option value="housekeeping">Housekeeping</option>
                  <option value="other">Other</option>
                </select>
                {categoryMode === "custom" ? (
                  <input
                    className="text-input"
                    placeholder="Type category"
                    required
                    value={formState.category}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, category: event.target.value }))
                    }
                  />
                ) : null}
                <textarea
                  className="text-area"
                  placeholder="Product description"
                  required
                  value={formState.description}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, description: event.target.value }))
                  }
                />
                <input
                  className="text-input"
                  min="0.01"
                  placeholder="Price"
                  required
                  step="0.01"
                  type="number"
                  value={formState.price}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, price: event.target.value }))
                  }
                />
                <select
                  className="select-input"
                  value={formState.pricingUnit}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, pricingUnit: event.target.value }))
                  }
                >
                  <option value="piece">Per piece</option>
                  <option value="kilogram">Per kilogram</option>
                </select>
                <input
                  className="text-input"
                  min="0"
                  placeholder="Stock quantity"
                  required
                  step="1"
                  type="number"
                  value={formState.stockQuantity}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, stockQuantity: event.target.value }))
                  }
                />
                <label className="toggle-row">
                  <input
                    checked={formState.isActive}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, isActive: event.target.checked }))
                    }
                    type="checkbox"
                  />
                  <span>
                    <strong>Available in storefront</strong>
                    <small>Turn off to hide this product from customers.</small>
                  </span>
                </label>
                <div className="action-group">
                  <button className="primary-button" disabled={isSavingProduct} type="submit">
                    {isSavingProduct ? "Saving..." : "Save product"}
                  </button>
                  <button
                    className="tertiary-button"
                    onClick={() => setIsCreateProductOpen(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          <section className="admin-subcard">
            <div className="section-header compact admin-subcard-header">
              <div>
                <h2>Inventory list</h2>
                <p>Tap any product card to update details or remove it.</p>
              </div>
              <span>{filteredProducts.length} match{filteredProducts.length === 1 ? "" : "es"}</span>
            </div>

            <div className="product-grid admin-product-grid">
              {paginatedProducts.map((product) => (
                <button
                  className="product-card order-card-button"
                  key={product.id}
                  onClick={() => openProductModal(product)}
                  type="button"
                >
                  <div className="product-card-top">
                    <div className="product-badge">{product.category}</div>
                    <span className={`status-pill ${product.is_active ? "status-confirmed" : "status-muted"}`}>
                      {product.is_active ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <h3>{product.name}</h3>
                  <p className="product-summary">{getCompactDescription(product.description)}</p>
                  <div className="product-footer">
                    <strong>{pesoSign}{Number(product.price).toFixed(2)}</strong>
                    <span className="product-tagline">
                      {Number(product.stock_quantity ?? 0)} in stock
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {productsPageCount > 1 && (
              <div className="pagination-controls">
                <button
                  className="secondary-button"
                  disabled={productsPage === 1}
                  onClick={() => setProductsPage(productsPage - 1)}
                  type="button"
                >
                  Previous
                </button>
                <span className="pagination-info">Page {productsPage} of {productsPageCount}</span>
                <button
                  className="secondary-button"
                  disabled={productsPage === productsPageCount}
                  onClick={() => setProductsPage(productsPage + 1)}
                  type="button"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </section>

        <section
          className={`card admin-section-card ${activeMobileSection !== "orders" ? "mobile-admin-section-hidden" : ""}`}
        >
          <div className="section-header compact">
            <div>
              <h2>Recent orders</h2>
              <p>Active orders that still need action.</p>
            </div>
            <button className="tertiary-button" onClick={viewArchives} type="button">
              Archive
            </button>
          </div>

          <section className="admin-subcard">
            <div className="section-header compact admin-subcard-header">
              <div>
                <h2>Orders queue</h2>
                <p>Move orders from pending to accepted, preparing, ready, and completed.</p>
              </div>
              <span>{filteredActiveOrders.length} shown</span>
            </div>

            <div className="admin-filter-toolbar">
              <select
                className="select-input"
                value={orderStatusFilter}
                onChange={(event) => updateOrderStatusFilter(event.target.value)}
              >
                <option value="all">All active statuses</option>
                {orderStatusOptions
                  .filter((option) => !archiveStatuses.has(option.value))
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} only
                    </option>
                  ))}
              </select>
              <input
                className="text-input"
                placeholder="Search customer, mobile, address, or reference"
                value={orderQuery}
                onChange={(event) => updateOrderQuery(event.target.value)}
              />
            </div>

            <div className="stack-list">
              {filteredActiveOrders.length === 0 ? (
                <div className="empty-state compact-empty-state">
                  <h3>No matching active orders.</h3>
                  <p>Adjust the status filter or search text to see more orders.</p>
                </div>
              ) : null}
              {paginatedOrders.map((order) => (
                <button
                  className="order-card order-card-button"
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  type="button"
                >
                  <div className="order-header">
                    <strong>{getCustomerName(order)}</strong>
                    <span className={`status-pill status-${order.status}`}>{order.status}</span>
                  </div>
                  <p className="order-summary">{getCompactOrderMeta(order)}</p>
                  <div className="order-footer">
                    <span className="order-summary">{getAddressNote(order)}</span>
                    <strong>{pesoSign}{Number(order.total).toFixed(2)}</strong>
                  </div>
                </button>
              ))}
            </div>

            {ordersPageCount > 1 && (
              <div className="pagination-controls">
                <button
                  className="secondary-button"
                  disabled={ordersPage === 1}
                  onClick={() => setOrdersPage(ordersPage - 1)}
                  type="button"
                >
                  Previous
                </button>
                <span className="pagination-info">Page {ordersPage} of {ordersPageCount}</span>
                <button
                  className="secondary-button"
                  disabled={ordersPage === ordersPageCount}
                  onClick={() => setOrdersPage(ordersPage + 1)}
                  type="button"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </section>

      </div>

      {selectedOrder ? (
        <div className="modal-backdrop" onClick={() => setSelectedOrderId(null)} role="presentation">
          <div
            aria-modal="true"
            className="modal-shell order-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <section className="card printable-order">
              <div className="print-receipt-header">
                <strong>A&amp;M Online Grocery Store</strong>
                <span>Order receipt</span>
              </div>

              <div className="section-header">
                <div>
                  <span className="eyebrow">Order details</span>
                  <h2>{getCustomerName(selectedOrder)}</h2>
                  <p>Placed {formatDateTime(selectedOrder.created_at)}</p>
                </div>
                <div className="order-modal-actions order-header-actions">
                  <button className="secondary-button" onClick={handlePrintOrder} type="button">
                    Print receipt
                  </button>
                  <button className="tertiary-button" onClick={() => setSelectedOrderId(null)} type="button">
                    Close
                  </button>
                </div>
              </div>

              <div className="order-detail-grid">
                <div className="order-detail-card">
                  <span className="field-label">Reference</span>
                  <strong>{getOrderReference(selectedOrder)}</strong>
                </div>
                <div className="order-detail-card">
                  <span className="field-label">Mobile number</span>
                  <strong>{selectedOrder.mobile_number || "Not provided"}</strong>
                </div>
                <div className="order-detail-card">
                  <span className="field-label">Address / note</span>
                  <strong>{getAddressNote(selectedOrder)}</strong>
                </div>
                <div className="order-detail-card">
                  <span className="field-label">Delivery window</span>
                  <strong>{selectedOrder.deliveryWindow || selectedOrder.delivery_window}</strong>
                </div>
                <div className="order-detail-card">
                  <span className="field-label">Status</span>
                  <strong>{selectedOrder.status}</strong>
                </div>
              </div>

              <div className="order-detail-block order-timeline-block">
                <h3>Order timeline</h3>
                <div className="order-timeline">
                  {getOrderTimeline(selectedOrder).map((event) => (
                    <div className="order-timeline-item" key={event.id}>
                      <span className={`order-timeline-dot status-${event.status}`} />
                      <div>
                        <strong>{event.label}</strong>
                        <p>{formatDateTime(event.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="order-detail-block">
                <h3>Items</h3>
                <div className="stack-list">
                  {(selectedOrder.items || []).map((item, index) => (
                    <div className="order-item-row" key={`${item.product_id || item.name}-${index}`}>
                      <div>
                        <strong>{item.name}</strong>
                        <p>
                          {item.quantity} x {pesoSign}{Number(item.unit_price).toFixed(2)} {getPricingUnitLabel(item.pricing_unit)}
                        </p>
                      </div>
                      <strong>{pesoSign}{Number(item.line_total).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="order-detail-block">
                <h3>Customer notes</h3>
                <p>{selectedOrder.notes || "No special instructions."}</p>
              </div>

              <div className="summary-box cart-summary-box">
                <div>
                  <span>Subtotal</span>
                  <strong>{pesoSign}{Number(selectedOrder.subtotal || 0).toFixed(2)}</strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong>{pesoSign}{Number(selectedOrder.total).toFixed(2)}</strong>
                </div>
              </div>

              <div className="order-modal-actions action-group">
                <button
                  className="danger-button"
                  disabled={archiveStatuses.has(selectedOrder.status) || isUpdatingOrder}
                  onClick={handleCancelOrder}
                  type="button"
                >
                  {isUpdatingOrder
                    ? "Updating..."
                    : selectedOrder.status === "cancelled"
                      ? "Canceled"
                      : "Canceled"}
                </button>
                <button
                  className="primary-button"
                  disabled={archiveStatuses.has(selectedOrder.status) || isUpdatingOrder}
                  onClick={handleNextOrderStatus}
                  type="button"
                >
                  {isUpdatingOrder
                    ? "Updating..."
                    : nextStatusByStatus[selectedOrder.status]?.label || "No next status"}
                </button>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {isArchiveModalOpen ? (
        <div className="modal-backdrop" onClick={() => setIsArchiveModalOpen(false)} role="presentation">
          <div
            aria-modal="true"
            className="modal-shell order-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <section className="card">
              <div className="section-header">
                <div>
                  <span className="eyebrow">Archives</span>
                  <h2>Archived orders</h2>
                  <p>Completed and canceled orders.</p>
                </div>
                <button className="tertiary-button" onClick={() => setIsArchiveModalOpen(false)} type="button">
                  Close
                </button>
              </div>

              <div className="stack-list">
                {archivedOrders.length === 0 ? (
                  <div className="empty-state compact-empty-state">
                    <h3>No archived orders.</h3>
                    <p>Accepted and canceled orders will move here automatically.</p>
                  </div>
                ) : null}
                {paginatedArchivedOrders.map((order) => (
                  <button
                    className="order-card order-card-button"
                    key={order.id}
                    onClick={() => {
                      setIsArchiveModalOpen(false);
                      setSelectedOrderId(order.id);
                    }}
                    type="button"
                  >
                    <div className="order-header">
                      <strong>{getCustomerName(order)}</strong>
                      <span className={`status-pill status-${order.status}`}>{order.status}</span>
                    </div>
                    <p className="order-summary">{getCompactOrderMeta(order)}</p>
                    <div className="order-footer">
                      <span className="order-summary">{getAddressNote(order)}</span>
                      <strong>{pesoSign}{Number(order.total).toFixed(2)}</strong>
                    </div>
                  </button>
                ))}
              </div>

              {archivedOrdersPageCount > 1 && (
                <div className="pagination-controls">
                  <button
                    className="secondary-button"
                    disabled={archivedOrdersPage === 1}
                    onClick={() => setArchivedOrdersPage(archivedOrdersPage - 1)}
                    type="button"
                  >
                    Previous
                  </button>
                  <span className="pagination-info">Page {archivedOrdersPage} of {archivedOrdersPageCount}</span>
                  <button
                    className="secondary-button"
                    disabled={archivedOrdersPage === archivedOrdersPageCount}
                    onClick={() => setArchivedOrdersPage(archivedOrdersPage + 1)}
                    type="button"
                  >
                    Next
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      ) : null}

      {selectedProduct ? (
        <div className="modal-backdrop" onClick={closeProductModal} role="presentation">
          <div
            aria-modal="true"
            className="modal-shell"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <section className="card">
              <div className="section-header">
                <div>
                  <span className="eyebrow">Edit product</span>
                  <h2>{selectedProduct.name}</h2>
                  <p>Update product details or delete this item from the database.</p>
                </div>
                <button className="tertiary-button" onClick={closeProductModal} type="button">
                  Close
                </button>
              </div>

              <form className="checkout-form" onSubmit={handleSaveProductEdit}>
                <input
                  className="text-input"
                  placeholder="Product name"
                  required
                  value={editFormState.name}
                  onChange={(event) =>
                    setEditFormState((current) => ({ ...current, name: event.target.value }))
                  }
                />
                <select
                  className="select-input"
                  value={editCategoryMode === "custom" ? "other" : editFormState.category}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    if (nextValue === "other") {
                      setEditCategoryMode("custom");
                      setEditFormState((current) => ({ ...current, category: "" }));
                      return;
                    }

                    setEditCategoryMode("preset");
                    setEditFormState((current) => ({ ...current, category: nextValue }));
                  }}
                >
                  <option value="refreshments">Refreshments</option>
                  <option value="wellness">Wellness</option>
                  <option value="housekeeping">Housekeeping</option>
                  <option value="other">Other</option>
                </select>
                {editCategoryMode === "custom" ? (
                  <input
                    className="text-input"
                    placeholder="Type category"
                    required
                    value={editFormState.category}
                    onChange={(event) =>
                      setEditFormState((current) => ({ ...current, category: event.target.value }))
                    }
                  />
                ) : null}
                <textarea
                  className="text-area"
                  placeholder="Product description"
                  required
                  value={editFormState.description}
                  onChange={(event) =>
                    setEditFormState((current) => ({ ...current, description: event.target.value }))
                  }
                />
                <input
                  className="text-input"
                  min="0.01"
                  placeholder="Price"
                  required
                  step="0.01"
                  type="number"
                  value={editFormState.price}
                  onChange={(event) =>
                    setEditFormState((current) => ({ ...current, price: event.target.value }))
                  }
                />
                <select
                  className="select-input"
                  value={editFormState.pricingUnit}
                  onChange={(event) =>
                    setEditFormState((current) => ({ ...current, pricingUnit: event.target.value }))
                  }
                >
                  <option value="piece">Per piece</option>
                  <option value="kilogram">Per kilogram</option>
                </select>
                <input
                  className="text-input"
                  min="0"
                  placeholder="Stock quantity"
                  required
                  step="1"
                  type="number"
                  value={editFormState.stockQuantity}
                  onChange={(event) =>
                    setEditFormState((current) => ({ ...current, stockQuantity: event.target.value }))
                  }
                />
                <label className="toggle-row">
                  <input
                    checked={editFormState.isActive}
                    onChange={(event) =>
                      setEditFormState((current) => ({ ...current, isActive: event.target.checked }))
                    }
                    type="checkbox"
                  />
                  <span>
                    <strong>Available in storefront</strong>
                    <small>Turn off to hide this product from customers.</small>
                  </span>
                </label>

                <div className="product-modal-actions action-group-split">
                  <button
                    className="danger-button"
                    disabled={isDeletingProduct || isSavingProduct}
                    onClick={handleDeleteSelectedProduct}
                    type="button"
                  >
                    {isDeletingProduct ? "Deleting..." : "Delete product"}
                  </button>
                  <div className="order-modal-actions action-group">
                    <button className="tertiary-button" onClick={closeProductModal} type="button">
                      Cancel
                    </button>
                    <button className="primary-button" disabled={isSavingProduct || isDeletingProduct} type="submit">
                      {isSavingProduct ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </div>
        </div>
      ) : null}
    </>
  );
}
