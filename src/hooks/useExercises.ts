import { useEffect, useState } from 'react'
import { loadData, saveData } from '../storage'
import type { Exercise, ExerciseDraft, ImportMode } from '../types'

const byMostRecentlyUpdated = (a: Exercise, b: Exercise): number =>
  b.updatedAt.localeCompare(a.updatedAt)

export const useExercises = () => {
  const [exercises, setExercises] = useState<Exercise[]>(() =>
    loadData().exercises.sort(byMostRecentlyUpdated),
  )

  useEffect(() => {
    try {
      saveData(exercises)
    } catch (error) {
      console.error('Exercise data could not be saved.', error)
    }
  }, [exercises])

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

  const importExercises = (incoming: Exercise[], mode: ImportMode): void => {
    if (mode === 'replace') {
      setExercises([...incoming].sort(byMostRecentlyUpdated))
      return
    }

    setExercises((current) => {
      const merged = new Map(current.map((exercise) => [exercise.id, exercise]))

      for (const exercise of incoming) {
        const existing = merged.get(exercise.id)
        if (!existing || exercise.updatedAt > existing.updatedAt) {
          merged.set(exercise.id, exercise)
        }
      }

      return [...merged.values()].sort(byMostRecentlyUpdated)
    })
  }

  return {
    exercises,
    addExercise,
    updateExercise,
    removeExercise,
    importExercises,
  }
}
