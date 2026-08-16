import { useMemo } from 'react'
import { hasTag } from '../categories'
import type { Exercise } from '../types'
import { ExerciseList } from './ExerciseList'

type CategoryViewProps = {
  tag: string
  exercises: Exercise[]
  onBack: () => void
  onEdit: (exercise: Exercise) => void
  onDelete: (exercise: Exercise) => void
  onSelectTag: (tag: string) => void
}

export function CategoryView({
  tag,
  exercises,
  onBack,
  onEdit,
  onDelete,
  onSelectTag,
}: CategoryViewProps) {
  const categoryExercises = useMemo(
    () => exercises.filter((exercise) => hasTag(exercise, tag)),
    [exercises, tag],
  )

  return (
    <main className="page-shell category-page has-tab-bar">
      <header className="subpage-header">
        <button
          className="icon-button"
          type="button"
          onClick={onBack}
          aria-label="Back to categories"
        >
          ←
        </button>
        <div>
          <p className="eyebrow">Category</p>
          <h1>{tag}</h1>
        </div>
      </header>

      <div className="result-summary" aria-live="polite">
        <span>
          {categoryExercises.length} exercise
          {categoryExercises.length === 1 ? '' : 's'}
        </span>
      </div>

      <ExerciseList
        exercises={categoryExercises}
        hasFilters
        onEdit={onEdit}
        onDelete={onDelete}
        onSelectTag={onSelectTag}
      />
    </main>
  )
}
