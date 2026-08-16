import type { Exercise } from './types'

export const normalizeTag = (tag: string): string =>
  tag.trim().toLocaleLowerCase()

export const sameTag = (a: string, b: string): boolean =>
  normalizeTag(a) === normalizeTag(b)

export const hasTag = (exercise: Exercise, tag: string): boolean =>
  exercise.tags.some((exerciseTag) => sameTag(exerciseTag, tag))

export const uniqueTagsOf = (exercises: Exercise[]): string[] => {
  const tagsByNormalizedName = new Map<string, string>()

  for (const exercise of exercises) {
    for (const exerciseTag of exercise.tags) {
      const tag = exerciseTag.trim()
      const normalized = normalizeTag(tag)
      if (normalized && !tagsByNormalizedName.has(normalized)) {
        tagsByNormalizedName.set(normalized, tag)
      }
    }
  }

  return [...tagsByNormalizedName.values()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  )
}

export const countExercisesPerTag = (
  exercises: Exercise[],
  tags: string[],
): Map<string, number> =>
  new Map(
    tags.map((tag) => [
      tag,
      exercises.filter((exercise) => hasTag(exercise, tag)).length,
    ]),
  )
