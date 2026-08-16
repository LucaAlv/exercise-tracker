import type { Exercise, StoredData } from './types'

const STORAGE_KEY = 'exercise-library-data'

const emptyData = (): StoredData => ({
  version: 2,
  exercises: [],
  categories: [],
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isExercise = (value: unknown): value is Exercise => {
  if (!isRecord(value)) return false

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === 'string') &&
    typeof value.notes === 'string' &&
    typeof value.videoUrl === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  )
}

export const parseStoredData = (value: unknown): StoredData | null => {
  if (
    !isRecord(value) ||
    !Array.isArray(value.exercises) ||
    !value.exercises.every(isExercise)
  ) {
    return null
  }

  if (value.version === 1) {
    return { version: 2, exercises: value.exercises, categories: [] }
  }

  if (
    value.version === 2 &&
    Array.isArray(value.categories) &&
    value.categories.every((category) => typeof category === 'string')
  ) {
    return {
      version: 2,
      exercises: value.exercises,
      categories: value.categories,
    }
  }

  return null
}

export const loadData = (): StoredData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return emptyData()

    const parsed: unknown = JSON.parse(raw)
    const data = parseStoredData(parsed)
    if (data) return data

    console.warn('Stored exercise data has an unsupported shape; starting empty.')
  } catch (error) {
    console.warn('Stored exercise data could not be read; starting empty.', error)
  }

  return emptyData()
}

export const saveData = (exercises: Exercise[], categories: string[]): void => {
  const data: StoredData = { version: 2, exercises, categories }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const parseBackup = (json: string): StoredData => {
  let parsed: unknown

  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('That file is not valid JSON.')
  }

  const data = parseStoredData(parsed)
  if (!data) {
    throw new Error('That file is not an Exercise Library backup.')
  }

  return data
}

export const createBackupJson = (
  exercises: Exercise[],
  categories: string[],
): string =>
  JSON.stringify(
    { version: 2, exercises, categories } satisfies StoredData,
    null,
    2,
  )

export const createBackupFilename = (): string => {
  const date = new Date().toISOString().slice(0, 10)
  return `exercise-library-${date}.json`
}
