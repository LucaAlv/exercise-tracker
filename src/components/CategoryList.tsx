type CategoryListProps = {
  categories: string[]
  counts: Map<string, number>
  onSelect: (tag: string) => void
  onManage: () => void
}

export function CategoryList({
  categories,
  counts,
  onSelect,
  onManage,
}: CategoryListProps) {
  return (
    <main className="page-shell categories-page has-tab-bar">
      <header className="app-header">
        <div>
          <p className="eyebrow">Browse by focus</p>
          <h1>Categories</h1>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={onManage}
          aria-label="Manage categories"
          title="Manage categories"
        >
          ⚙
        </button>
      </header>

      {categories.length === 0 ? (
        <div className="empty-state">
          <span aria-hidden="true">▦</span>
          <h2>No categories yet</h2>
          <p>Choose which of your exercise tags should appear here.</p>
          <button
            className="button button-primary empty-state-action"
            type="button"
            onClick={onManage}
          >
            Manage categories
          </button>
        </div>
      ) : (
        <div className="category-grid">
          {categories.map((category) => {
            const count = counts.get(category) ?? 0

            return (
              <button
                className="category-card"
                type="button"
                key={category}
                onClick={() => onSelect(category)}
              >
                <span>
                  <strong>{category}</strong>
                  <small>
                    {count} exercise{count === 1 ? '' : 's'}
                  </small>
                </span>
                <span className="category-arrow" aria-hidden="true">
                  →
                </span>
              </button>
            )
          })}
        </div>
      )}
    </main>
  )
}
