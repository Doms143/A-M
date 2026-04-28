export function CatalogPanel({
  filters,
  isLoading,
  products,
  onAddToCart,
  onFiltersChange
}) {
  return (
    <section className="card">
      <div className="section-header">
        <div>
          <h2>Resort catalog</h2>
          <p>Filter essentials, minibar refills, spa supplies, and amenity kits.</p>
        </div>
        <div className="filter-row">
          <input
            className="text-input"
            placeholder="Search products"
            value={filters.query}
            onChange={(event) =>
              onFiltersChange((current) => ({ ...current, query: event.target.value }))
            }
          />
          <select
            className="select-input"
            value={filters.category}
            onChange={(event) =>
              onFiltersChange((current) => ({ ...current, category: event.target.value }))
            }
          >
            <option value="all">All categories</option>
            <option value="refreshments">Refreshments</option>
            <option value="wellness">Wellness</option>
            <option value="housekeeping">Housekeeping</option>
          </select>
        </div>
      </div>

      {isLoading ? <p>Loading products...</p> : null}

      <div className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <div className="product-badge">{product.category}</div>
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <div className="product-footer">
              <strong>${product.price.toFixed(2)}</strong>
              <button className="primary-button" onClick={() => onAddToCart(product)}>
                Add
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
