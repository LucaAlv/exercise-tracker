import { useMemo, useState } from 'react'
import { BackupPanel } from './components/BackupPanel'
import { ExerciseForm } from './components/ExerciseForm'
import { ExerciseList } from './components/ExerciseList'
import { TagFilter } from './components/TagFilter'
import { useExercises } from './hooks/useExercises'
import type { Exercise, ExerciseDraft } from './types'

type View =
  | { name: 'library' }
  | { name: 'add' }
  | { name: 'edit'; exerciseId: string }
  | { name: 'backup' }

export default function App() {
  const {
    exercises,
    addExercise,
    updateExercise,
    removeExercise,
    importExercises,
  } = useExercises()
  const [view, setView] = useState<View>({ name: 'library' })
  const [query, setQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const allTags = useMemo(
    () =>
      [...new Set(exercises.flatMap((exercise) => exercise.tags))].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' }),
      ),
    [exercises],
  )

  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()

    return exercises.filter((exercise) => {
      const hasTag =
        selectedTag === null ||
        exercise.tags.some(
          (tag) => tag.toLocaleLowerCase() === selectedTag.toLocaleLowerCase(),
        )
      if (!hasTag) return false
      if (!normalizedQuery) return true

      return [exercise.name, exercise.notes, exercise.tags.join(' ')]
        .join(' ')
        .toLocaleLowerCase()
        .includes(normalizedQuery)
    })
  }, [exercises, query, selectedTag])

  const editingExercise =
    view.name === 'edit'
      ? exercises.find((exercise) => exercise.id === view.exerciseId)
      : undefined

  const showLibrary = () => setView({ name: 'library' })

  const saveExercise = (draft: ExerciseDraft) => {
    if (view.name === 'edit') updateExercise(view.exerciseId, draft)
    else addExercise(draft)
    showLibrary()
  }

  const deleteExercise = (exercise: Exercise) => {
    if (window.confirm(`Delete “${exercise.name}”? This cannot be undone unless you have a backup.`)) {
      removeExercise(exercise.id)
    }
  }

  if (view.name === 'add' || view.name === 'edit') {
    return (
      <ExerciseForm
        exercise={editingExercise}
        onSave={saveExercise}
        onCancel={showLibrary}
      />
    )
  }

  if (view.name === 'backup') {
    return (
      <BackupPanel
        exercises={exercises}
        onBack={showLibrary}
        onImport={importExercises}
      />
    )
  }

  return (
    <main className="page-shell library-page">
      <header className="app-header">
        <div>
          <p className="eyebrow">Personal reference</p>
          <h1>Exercise Library</h1>
        </div>
        <button
          className="icon-button backup-button"
          type="button"
          onClick={() => setView({ name: 'backup' })}
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
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search exercises"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
              ×
            </button>
          )}
        </label>

        <TagFilter tags={allTags} selectedTag={selectedTag} onSelect={setSelectedTag} />
      </section>

      <div className="result-summary" aria-live="polite">
        <span>
          {filteredExercises.length} exercise{filteredExercises.length === 1 ? '' : 's'}
        </span>
        {(query || selectedTag) && (
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setQuery('')
              setSelectedTag(null)
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      <ExerciseList
        exercises={filteredExercises}
        hasFilters={Boolean(query || selectedTag)}
        onEdit={(exercise) => setView({ name: 'edit', exerciseId: exercise.id })}
        onDelete={deleteExercise}
        onSelectTag={(tag) => {
          setSelectedTag(tag)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />

      <button
        className="fab"
        type="button"
        onClick={() => setView({ name: 'add' })}
        aria-label="Add exercise"
      >
        <span aria-hidden="true">+</span>
        Add exercise
      </button>
    </main>
  )
}
