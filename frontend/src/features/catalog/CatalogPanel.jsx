const categoryOptions = [
  { value: "all", label: "All items" },
  { value: "refreshments", label: "Refreshments" },
  { value: "wellness", label: "Wellness" },
  { value: "housekeeping", label: "Housekeeping" }
];

const pesoSign = "\u20b1";

function getPricingUnitLabel(pricingUnit) {
  return pricingUnit === "kilogram" ? "per kg" : "each";
}

function getCompactDescription(description) {
  if (!description) {
    return "Everyday store essential.";
  }

  const normalized = description.trim();
  if (normalized.length <= 68) {
    return normalized;
  }

  return `${normalized.slice(0, 65).trimEnd()}...`;
}

function getStockQuantity(product) {
  return Number(product.stock_quantity ?? 0);
}

function CatalogSkeletonGrid() {
  return (
    <div className="product-grid skeleton-grid" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <article className="product-card skeleton-card" key={`catalog-skeleton-${index}`}>
          <div className="product-card-top">
            <span className="skeleton-pill skeleton-pill-wide" />
            <span className="skeleton-pill" />
          </div>
          <span className="skeleton-line skeleton-line-title" />
          <span className="skeleton-line" />
          <span className="skeleton-line skeleton-line-short" />
          <div className="product-footer">
            <span className="skeleton-line skeleton-price" />
            <span className="skeleton-button" />
          </div>
        </article>
      ))}
    </div>
  );
}

export function CatalogPanel({
  filters,
  isLoading,
  page,
  pageCount,
  products,
  totalProducts,
  onAddToCart,
  onFiltersChange,
  onPageChange
}) {
  return (
    <section className="card catalog-card" aria-busy={isLoading}>
      <div className="section-header catalog-header">
        <div>
          <h2>Sari-sari catalog</h2>
          <p>Browse daily essentials, snacks, canned goods, sachets, and household basics.</p>
        </div>
        <div className="catalog-toolbar">
          <input
            className="text-input"
            placeholder="Search snacks, drinks, toiletries..."
            value={filters.query}
            onChange={(event) =>
              onFiltersChange((current) => ({ ...current, query: event.target.value }))
            }
          />
        </div>
      </div>

      <div className="catalog-filter-bar">
        <div className="filter-chip-row" role="tablist" aria-label="Product categories">
          {categoryOptions.map((option) => (
            <button
              aria-pressed={filters.category === option.value}
              className={`filter-chip ${filters.category === option.value ? "filter-chip-active" : ""}`}
              key={option.value}
              onClick={() =>
                onFiltersChange((current) => ({ ...current, category: option.value }))
              }
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="catalog-results">
          {isLoading ? "Loading..." : `${totalProducts} item${totalProducts === 1 ? "" : "s"} found`}
        </span>
      </div>

      {isLoading ? <CatalogSkeletonGrid /> : null}
      {!isLoading && products.length === 0 ? (
        <div className="empty-state">
          <h3>No products match this filter.</h3>
          <p>Try another category or remove part of your search to see more items.</p>
        </div>
      ) : null}

      {!isLoading ? (
        <div className="product-grid">
          {products.map((product) => {
            const stockQuantity = getStockQuantity(product);
            const isOutOfStock = stockQuantity <= 0;

            return (
              <article className="product-card" key={product.id}>
                <div className="product-card-top">
                  <div className="product-badge">{product.category}</div>
                  <span className={`product-tagline ${isOutOfStock ? "product-tagline-muted" : ""}`}>
                    {isOutOfStock ? "Out of stock" : `${stockQuantity} left`}
                  </span>
                </div>
                <h3>{product.name}</h3>
                <p className="product-summary">{getCompactDescription(product.description)}</p>
                <div className="product-footer">
                  <strong>{pesoSign}{product.price.toFixed(2)}</strong>
                  <button
                    className="primary-button"
                    disabled={isOutOfStock}
                    onClick={() => onAddToCart(product)}
                    type="button"
                  >
                    {isOutOfStock ? "Unavailable" : "Add to cart"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {!isLoading && pageCount > 1 ? (
        <div className="pagination-controls">
          <button
            className="secondary-button"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            type="button"
          >
            Previous
          </button>
          <span className="pagination-info">Page {page} of {pageCount}</span>
          <button
            className="secondary-button"
            disabled={page === pageCount}
            onClick={() => onPageChange(page + 1)}
            type="button"
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}
