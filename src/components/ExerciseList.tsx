import { useState } from 'react'
import type { Exercise } from '../types'
import {
  getYoutubeThumbnail,
  getYoutubeVideoId,
  isSafeExternalUrl,
} from '../youtube'

type ExerciseListProps = {
  exercises: Exercise[]
  hasFilters: boolean
  onEdit: (exercise: Exercise) => void
  onDelete: (exercise: Exercise) => void
  onSelectTag: (tag: string) => void
}

function Thumbnail({ exercise }: { exercise: Exercise }) {
  const videoId = getYoutubeVideoId(exercise.videoUrl)
  if (!videoId) return null

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget
    const fallback = getYoutubeThumbnail(videoId, 'hqdefault')
    if (image.src !== fallback) image.src = fallback
  }

  return (
    <span className="exercise-thumbnail-frame">
      <img
        ref={(image) => {
          // Cached images can finish loading before React attaches onLoad,
          // in which case onLoad never fires and the image would stay at
          // opacity 0 forever. Catch that case here.
          if (image?.complete) image.dataset.loaded = 'true'
        }}
        className="exercise-thumbnail"
        src={getYoutubeThumbnail(videoId)}
        alt=""
        loading="lazy"
        onLoad={(event) => {
          event.currentTarget.dataset.loaded = 'true'
        }}
        onError={handleError}
      />
    </span>
  )
}

export function ExerciseList({
  exercises,
  hasFilters,
  onEdit,
  onDelete,
  onSelectTag,
}: ExerciseListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (exercises.length === 0) {
    return (
      <div className={hasFilters ? 'empty-state' : 'empty-state is-first-run'}>
        <span aria-hidden="true">{hasFilters ? '⌕' : '+'}</span>
        <h2>{hasFilters ? 'No matches' : 'Your library is empty'}</h2>
        <p>
          {hasFilters
            ? 'Try another search or tag.'
            : 'Add an exercise to keep its cues and source video close at hand.'}
        </p>
      </div>
    )
  }

  return (
    <div className="exercise-list">
      {exercises.map((exercise) => {
        const isExpanded = exercise.id === expandedId
        const hasLink = isSafeExternalUrl(exercise.videoUrl)

        return (
          <article
            className={isExpanded ? 'exercise-card is-expanded' : 'exercise-card'}
            key={exercise.id}
          >
            <button
              className="card-summary"
              type="button"
              aria-expanded={isExpanded}
              onClick={() => setExpandedId(isExpanded ? null : exercise.id)}
            >
              <Thumbnail exercise={exercise} />
              <span className="card-copy">
                <span className="card-title-row">
                  <strong>{exercise.name}</strong>
                  <span className="expand-mark" aria-hidden="true">
                    {isExpanded ? '−' : '+'}
                  </span>
                </span>
                {exercise.tags.length > 0 && (
                  <span className="card-tags">
                    {exercise.tags.map((tag) => (
                      <span className="tag-chip tag-chip-static" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </span>
                )}
                {!isExpanded && exercise.notes && (
                  <span className="notes-preview">{exercise.notes}</span>
                )}
              </span>
            </button>

            <div className="card-details-wrap" inert={!isExpanded || undefined}>
              <div className="card-details-clip">
                <div className="card-details">
                  {exercise.notes && (
                    <p className="exercise-notes">{exercise.notes}</p>
                  )}

                  {exercise.tags.length > 0 && (
                    <div className="detail-tags">
                      {exercise.tags.map((tag) => (
                        <button
                          className="text-button"
                          type="button"
                          key={tag}
                          onClick={() => onSelectTag(tag)}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="card-actions">
                    {hasLink && (
                      <a
                        className="button button-secondary"
                        href={exercise.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open video ↗
                      </a>
                    )}
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => onEdit(exercise)}
                    >
                      Edit
                    </button>
                    <button
                      className="button button-danger"
                      type="button"
                      onClick={() => onDelete(exercise)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
