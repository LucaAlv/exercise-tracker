export type Exercise = {
  id: string
  name: string
  tags: string[]
  notes: string
  videoUrl: string
  createdAt: string
  updatedAt: string
}

export type ExerciseDraft = Pick<Exercise, 'name' | 'tags' | 'notes' | 'videoUrl'>

export type StoredData = {
  version: 2
  exercises: Exercise[]
  categories: string[]
}

export type ImportMode = 'merge' | 'replace'
