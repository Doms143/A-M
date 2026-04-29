const categoryOptions = [
  { value: "all", label: "All items" },
  { value: "refreshments", label: "Refreshments" },
  { value: "wellness", label: "Wellness" },
  { value: "housekeeping", label: "Housekeeping" }
];

export function CatalogPanel({
  filters,
  isLoading,
  products,
  onAddToCart,
  onFiltersChange
}) {
  return (
    <section className="card catalog-card">
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
          {isLoading ? "Loading..." : `${products.length} item${products.length === 1 ? "" : "s"} found`}
        </span>
      </div>

      {isLoading ? <p className="empty-state">Loading products...</p> : null}
      {!isLoading && products.length === 0 ? (
        <div className="empty-state">
          <h3>No products match this filter.</h3>
          <p>Try another category or remove part of your search to see more items.</p>
        </div>
      ) : null}

      <div className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <div className="product-card-top">
              <div className="product-badge">{product.category}</div>
              <span className="product-tagline">Daily essential</span>
            </div>
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <div className="product-footer">
              <strong>${product.price.toFixed(2)}</strong>
              <button className="primary-button" onClick={() => onAddToCart(product)} type="button">
                Add to cart
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
