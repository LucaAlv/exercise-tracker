import { sameTag } from '../categories'

type TagFilterProps = {
  tags: string[]
  selectedTag: string | null
  onSelect: (tag: string | null) => void
}

export function TagFilter({ tags, selectedTag, onSelect }: TagFilterProps) {
  if (tags.length === 0) return null

  return (
    <div className="tag-filter" aria-label="Filter by tag">
      <button
        className={selectedTag === null ? 'tag-chip is-selected' : 'tag-chip'}
        type="button"
        onClick={() => onSelect(null)}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          className={
            selectedTag !== null && sameTag(selectedTag, tag)
              ? 'tag-chip is-selected'
              : 'tag-chip'
          }
          type="button"
          key={tag}
          onClick={() =>
            onSelect(
              selectedTag !== null && sameTag(selectedTag, tag) ? null : tag,
            )
          }
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
