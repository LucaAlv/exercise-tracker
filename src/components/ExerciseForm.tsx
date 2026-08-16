import { useState } from 'react'
import type { Exercise, ExerciseDraft } from '../types'
import { isSafeExternalUrl } from '../youtube'

type ExerciseFormProps = {
  exercise?: Exercise
  onSave: (draft: ExerciseDraft) => void
  onCancel: () => void
}

const uniqueTags = (value: string): string[] => {
  const seen = new Set<string>()

  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => {
      const normalized = tag.toLocaleLowerCase()
      if (!tag || seen.has(normalized)) return false
      seen.add(normalized)
      return true
    })
}

export function ExerciseForm({ exercise, onSave, onCancel }: ExerciseFormProps) {
  const [name, setName] = useState(exercise?.name ?? '')
  const [tags, setTags] = useState(exercise?.tags.join(', ') ?? '')
  const [notes, setNotes] = useState(exercise?.notes ?? '')
  const [videoUrl, setVideoUrl] = useState(exercise?.videoUrl ?? '')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!name.trim()) {
      setError('Give the exercise a name.')
      return
    }

    if (videoUrl.trim() && !isSafeExternalUrl(videoUrl.trim())) {
      setError('Use a complete link starting with https:// or http://.')
      return
    }

    onSave({
      name: name.trim(),
      tags: uniqueTags(tags),
      notes: notes.trim(),
      videoUrl: videoUrl.trim(),
    })
  }

  return (
    <main className="page-shell editor-page">
      <header className="subpage-header">
        <button className="icon-button" type="button" onClick={onCancel} aria-label="Go back">
          ←
        </button>
        <div>
          <p className="eyebrow">Exercise</p>
          <h1>{exercise ? 'Edit details' : 'Add to library'}</h1>
        </div>
      </header>

      <form className="exercise-form" onSubmit={handleSubmit}>
        <label>
          <span>Name</span>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Copenhagen plank"
          />
        </label>

        <label>
          <span>Tags</span>
          <input
            type="text"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="core, hips, stability"
          />
          <small>Separate tags with commas.</small>
        </label>

        <label>
          <span>Execution notes</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Setup, cues, sets, reps…"
            rows={7}
          />
        </label>

        <label>
          <span>Source video</span>
          <input
            type="url"
            inputMode="url"
            value={videoUrl}
            onChange={(event) => setVideoUrl(event.target.value)}
            placeholder="https://youtu.be/…"
          />
          <small>YouTube links get a thumbnail automatically.</small>
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="form-actions">
          <button className="button button-secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="button button-primary" type="submit">
            {exercise ? 'Save changes' : 'Add exercise'}
          </button>
        </div>
      </form>
    </main>
  )
}
