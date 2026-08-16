import type { Exercise, StoredData } from './types'

const STORAGE_KEY = 'exercise-library-data'

const emptyData = (): StoredData => ({ version: 1, exercises: [] })

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

export const isStoredData = (value: unknown): value is StoredData =>
  isRecord(value) &&
  value.version === 1 &&
  Array.isArray(value.exercises) &&
  value.exercises.every(isExercise)

export const loadData = (): StoredData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return emptyData()

    const parsed: unknown = JSON.parse(raw)
    if (isStoredData(parsed)) return parsed

    console.warn('Stored exercise data has an unsupported shape; starting empty.')
  } catch (error) {
    console.warn('Stored exercise data could not be read; starting empty.', error)
  }

  return emptyData()
}

export const saveData = (exercises: Exercise[]): void => {
  const data: StoredData = { version: 1, exercises }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const parseBackup = (json: string): StoredData => {
  let parsed: unknown

  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('That file is not valid JSON.')
  }

  if (!isStoredData(parsed)) {
    throw new Error('That file is not an Exercise Library version 1 backup.')
  }

  return parsed
}

export const createBackupJson = (exercises: Exercise[]): string =>
  JSON.stringify({ version: 1, exercises } satisfies StoredData, null, 2)

export const createBackupFilename = (): string => {
  const date = new Date().toISOString().slice(0, 10)
  return `exercise-library-${date}.json`
}
