import { useMemo, useState } from 'react'
import {
  countExercisesPerTag,
  sameTag,
  uniqueTagsOf,
} from './categories'
import { BackupPanel } from './components/BackupPanel'
import { CategoryList } from './components/CategoryList'
import { CategorySettings } from './components/CategorySettings'
import { CategoryView } from './components/CategoryView'
import { ExerciseForm } from './components/ExerciseForm'
import { LibraryView } from './components/LibraryView'
import { TabBar } from './components/TabBar'
import { useLibrary } from './hooks/useLibrary'
import { scrollToTop } from './motion'
import type { Exercise, ExerciseDraft } from './types'

type View =
  | { name: 'library' }
  | { name: 'categories' }
  | { name: 'category'; tag: string }
  | { name: 'categorySettings' }
  | { name: 'add' }
  | { name: 'edit'; exerciseId: string }
  | { name: 'backup' }

export default function App() {
  const {
    exercises,
    categories,
    addExercise,
    updateExercise,
    removeExercise,
    toggleCategory,
    importData,
  } = useLibrary()
  const [view, setView] = useState<View>({ name: 'library' })
  const [query, setQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const allTags = useMemo(() => uniqueTagsOf(exercises), [exercises])
  const categoryCounts = useMemo(
    () => countExercisesPerTag(exercises, categories),
    [categories, exercises],
  )
  const settingsCounts = useMemo(
    () => countExercisesPerTag(exercises, [...categories, ...allTags]),
    [allTags, categories, exercises],
  )

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
    if (
      window.confirm(
        `Delete “${exercise.name}”? This cannot be undone unless you have a backup.`,
      )
    ) {
      removeExercise(exercise.id)
    }
  }

  const showTag = (tag: string) => {
    const category = categories.find((candidate) => sameTag(candidate, tag))
    if (category) {
      setView({ name: 'category', tag: category })
    } else {
      setSelectedTag(tag)
      showLibrary()
    }
    scrollToTop()
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
        categories={categories}
        onBack={showLibrary}
        onImport={importData}
      />
    )
  }

  if (view.name === 'categorySettings') {
    return (
      <CategorySettings
        allTags={allTags}
        categories={categories}
        counts={settingsCounts}
        onToggle={toggleCategory}
        onBack={() => setView({ name: 'categories' })}
      />
    )
  }

  let screen
  let activeTab: 'library' | 'categories'

  if (view.name === 'library') {
    activeTab = 'library'
    screen = (
      <LibraryView
        exercises={exercises}
        tags={allTags}
        query={query}
        selectedTag={selectedTag}
        onQueryChange={setQuery}
        onSelectTag={setSelectedTag}
        onBackup={() => setView({ name: 'backup' })}
        onAdd={() => setView({ name: 'add' })}
        onEdit={(exercise) =>
          setView({ name: 'edit', exerciseId: exercise.id })
        }
        onDelete={deleteExercise}
      />
    )
  } else if (view.name === 'categories') {
    activeTab = 'categories'
    screen = (
      <CategoryList
        categories={categories}
        counts={categoryCounts}
        onSelect={(tag) => setView({ name: 'category', tag })}
        onManage={() => setView({ name: 'categorySettings' })}
      />
    )
  } else {
    activeTab = 'categories'
    screen = (
      <CategoryView
        tag={view.tag}
        exercises={exercises}
        onBack={() => setView({ name: 'categories' })}
        onEdit={(exercise) =>
          setView({ name: 'edit', exerciseId: exercise.id })
        }
        onDelete={deleteExercise}
        onSelectTag={showTag}
      />
    )
  }

  return (
    <>
      {screen}
      <TabBar
        active={activeTab}
        onSelect={(tab) =>
          setView(tab === 'library' ? { name: 'library' } : { name: 'categories' })
        }
      />
    </>
  )
}
