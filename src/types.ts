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
  version: 1
  exercises: Exercise[]
}

export type ImportMode = 'merge' | 'replace'
