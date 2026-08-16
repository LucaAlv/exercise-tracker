import { useEffect, useState } from 'react'
import { sameTag } from '../categories'
import { loadData, saveData } from '../storage'
import type {
  Exercise,
  ExerciseDraft,
  ImportMode,
  StoredData,
} from '../types'

const byMostRecentlyUpdated = (a: Exercise, b: Exercise): number =>
  b.updatedAt.localeCompare(a.updatedAt)

export const useLibrary = () => {
  const [initialData] = useState(loadData)
  const [exercises, setExercises] = useState<Exercise[]>(() =>
    [...initialData.exercises].sort(byMostRecentlyUpdated),
  )
  const [categories, setCategories] = useState<string[]>(initialData.categories)

  useEffect(() => {
    try {
      saveData(exercises, categories)
    } catch (error) {
      console.error('Exercise data could not be saved.', error)
    }
  }, [exercises, categories])

  const addExercise = (draft: ExerciseDraft): Exercise => {
    const now = new Date().toISOString()
    const exercise: Exercise = {
      ...draft,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }

    setExercises((current) => [exercise, ...current])
    return exercise
  }

  const updateExercise = (id: string, draft: ExerciseDraft): void => {
    setExercises((current) =>
      current
        .map((exercise) =>
          exercise.id === id
            ? { ...exercise, ...draft, updatedAt: new Date().toISOString() }
            : exercise,
        )
        .sort(byMostRecentlyUpdated),
    )
  }

  const removeExercise = (id: string): void => {
    setExercises((current) => current.filter((exercise) => exercise.id !== id))
  }

  const toggleCategory = (tag: string): void => {
    setCategories((current) => {
      const existing = current.find((category) => sameTag(category, tag))
      if (existing) {
        return current.filter((category) => !sameTag(category, tag))
      }

      return [...current, tag]
    })
  }

  const importData = (incoming: StoredData, mode: ImportMode): void => {
    if (mode === 'replace') {
      setExercises([...incoming.exercises].sort(byMostRecentlyUpdated))
      setCategories([...incoming.categories])
      return
    }

    setExercises((current) => {
      const merged = new Map(current.map((exercise) => [exercise.id, exercise]))

      for (const exercise of incoming.exercises) {
        const existing = merged.get(exercise.id)
        if (!existing || exercise.updatedAt > existing.updatedAt) {
          merged.set(exercise.id, exercise)
        }
      }

      return [...merged.values()].sort(byMostRecentlyUpdated)
    })

    setCategories((current) => {
      const merged = [...current]
      for (const category of incoming.categories) {
        if (!merged.some((existing) => sameTag(existing, category))) {
          merged.push(category)
        }
      }
      return merged
    })
  }

  return {
    exercises,
    categories,
    addExercise,
    updateExercise,
    removeExercise,
    toggleCategory,
    importData,
  }
}
