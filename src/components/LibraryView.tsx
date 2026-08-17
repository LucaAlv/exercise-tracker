import { useMemo } from 'react'
import { hasTag } from '../categories'
import { scrollToTop } from '../motion'
import type { Exercise } from '../types'
import { ExerciseList } from './ExerciseList'
import { TagFilter } from './TagFilter'

type LibraryViewProps = {
  exercises: Exercise[]
  tags: string[]
  query: string
  selectedTag: string | null
  onQueryChange: (query: string) => void
  onSelectTag: (tag: string | null) => void
  onBackup: () => void
  onAdd: () => void
  onEdit: (exercise: Exercise) => void
  onDelete: (exercise: Exercise) => void
}

export function LibraryView({
  exercises,
  tags,
  query,
  selectedTag,
  onQueryChange,
  onSelectTag,
  onBackup,
  onAdd,
  onEdit,
  onDelete,
}: LibraryViewProps) {
  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()

    return exercises.filter((exercise) => {
      if (selectedTag !== null && !hasTag(exercise, selectedTag)) return false
      if (!normalizedQuery) return true

      return [exercise.name, exercise.notes, exercise.tags.join(' ')]
        .join(' ')
        .toLocaleLowerCase()
        .includes(normalizedQuery)
    })
  }, [exercises, query, selectedTag])

  const clearFilters = () => {
    onQueryChange('')
    onSelectTag(null)
  }

  return (
    <main className="page-shell library-page has-tab-bar">
      <header className="app-header">
        <div>
          <p className="eyebrow">Personal reference</p>
          <h1>Exercise Library</h1>
        </div>
        <button
          className="icon-button backup-button"
          type="button"
          onClick={onBackup}
          aria-label="Backup and restore"
          title="Backup and restore"
        >
          ⇩
        </button>
      </header>

      <section className="library-tools" aria-label="Search and filters">
        <label className="search-field">
          <span className="visually-hidden">Search exercises</span>
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search exercises"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </label>

        <TagFilter
          tags={tags}
          selectedTag={selectedTag}
          onSelect={onSelectTag}
        />
      </section>

      <div className="result-summary" aria-live="polite">
        <span>
          {filteredExercises.length} exercise
          {filteredExercises.length === 1 ? '' : 's'}
        </span>
        {(query || selectedTag) && (
          <button
            className="text-button"
            type="button"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        )}
      </div>

      <ExerciseList
        exercises={filteredExercises}
        hasFilters={Boolean(query || selectedTag)}
        onEdit={onEdit}
        onDelete={onDelete}
        onSelectTag={(tag) => {
          onSelectTag(tag)
          scrollToTop()
        }}
      />

      <button
        className="fab"
        type="button"
        onClick={onAdd}
        aria-label="Add exercise"
      >
        <span aria-hidden="true">+</span>
        Add exercise
      </button>
    </main>
  )
}
