import { sameTag } from '../categories'

type CategorySettingsProps = {
  allTags: string[]
  categories: string[]
  counts: Map<string, number>
  onToggle: (tag: string) => void
  onBack: () => void
}

export function CategorySettings({
  allTags,
  categories,
  counts,
  onToggle,
  onBack,
}: CategorySettingsProps) {
  const availableTags = [...categories]

  for (const tag of allTags) {
    if (!availableTags.some((existing) => sameTag(existing, tag))) {
      availableTags.push(tag)
    }
  }

  availableTags.sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  )

  return (
    <main className="page-shell category-settings-page">
      <header className="subpage-header">
        <button
          className="icon-button"
          type="button"
          onClick={onBack}
          aria-label="Go back"
        >
          ←
        </button>
        <div>
          <p className="eyebrow">Categories</p>
          <h1>Choose tags</h1>
        </div>
      </header>

      {availableTags.length === 0 ? (
        <div className="empty-state">
          <span aria-hidden="true">#</span>
          <h2>No tags yet</h2>
          <p>Tag some exercises first.</p>
        </div>
      ) : (
        <div className="category-settings-list">
          {availableTags.map((tag) => {
            const count = counts.get(tag) ?? 0
            const checked = categories.some((category) => sameTag(category, tag))

            return (
              <label className="category-toggle" key={tag}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(tag)}
                />
                <span>
                  <strong>{tag}</strong>
                  <small>
                    {count} exercise{count === 1 ? '' : 's'}
                  </small>
                </span>
              </label>
            )
          })}
        </div>
      )}
    </main>
  )
}
