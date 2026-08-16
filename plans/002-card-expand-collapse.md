# 002 — Animate the exercise card expand/collapse

- **Status**: TODO
- **Commit**: a3e8b75
- **Severity**: MEDIUM
- **Category**: Missed opportunities (state change that teleports) / Interruptibility
- **Estimated scope**: 2 files (`src/components/ExerciseList.tsx`, `src/styles.css`), ~30 lines

## Prerequisite

**Plan `001-press-feedback.md` must be executed first.** It defines `--ease-out` in the `:root` block of `src/styles.css`. If `--ease-out: cubic-bezier(0.23, 1, 0.32, 1);` is not present in `src/styles.css`, STOP and execute plan 001 first.

## Problem

Expanding an exercise card is the core interaction of this app. Today the detail block is a bare conditional render, so it materialises instantly and shoves every card below it down the page with no bridge:

```tsx
/* src/components/ExerciseList.tsx:101-147 — current (abridged) */
{isExpanded && (
  <div className="card-details">
    {exercise.notes && <p className="exercise-notes">{exercise.notes}</p>}

    {exercise.tags.length > 0 && (
      <div className="detail-tags">
        {/* …tag buttons… */}
      </div>
    )}

    <div className="card-actions">
      {/* …Open video / Edit / Delete… */}
    </div>
  </div>
)}
```

The jarring part is not the block appearing — it's the ~150px of instant layout displacement applied to everything below it, which costs the user their reading position in the list.

Because the element unmounts on collapse, there is currently no way to animate the closing direction at all.

## Target

Keep `.card-details` permanently mounted and animate the row it occupies. Two wrapper elements are added; **no existing CSS rule is modified**.

Markup — `src/components/ExerciseList.tsx`, replacing lines 101-147:

```tsx
/* target */
<div className="card-details-wrap" inert={!isExpanded || undefined}>
  <div className="card-details-clip">
    <div className="card-details">
      {exercise.notes && <p className="exercise-notes">{exercise.notes}</p>}

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
```

The children inside `.card-details` are **byte-for-byte the same as today** — only the two wrappers and the conditional are new.

CSS — new rules in `src/styles.css`, placed immediately after the existing `.card-details` rule (currently ends line 324):

```css
/* target */
.card-details-wrap {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 220ms var(--ease-out),
    opacity 160ms var(--ease-out);
}

.exercise-card.is-expanded .card-details-wrap {
  grid-template-rows: 1fr;
  opacity: 1;
  transition:
    grid-template-rows 220ms var(--ease-out),
    opacity 220ms var(--ease-out);
}

/* The clip layer must carry overflow/min-height, NOT .card-details itself:
   .card-details has padding and a border-top, and with the global
   box-sizing: border-box (src/styles.css:24) those would keep the collapsed
   row ~17px tall instead of 0. */
.card-details-clip {
  overflow: hidden;
  min-height: 0;
}
```

Reduced-motion handling — append inside the **existing** block at `src/styles.css:715`:

```css
/* target — inside the existing @media (prefers-reduced-motion: reduce) block */
.card-details-wrap,
.exercise-card.is-expanded .card-details-wrap {
  transition: opacity 160ms var(--ease-out);
}
```

This drops the size animation (movement) and keeps the fade (comprehension) — reduced motion means gentler, not zero.

Duration rationale, fixed by the audit playbook: this is an in-place reveal in the dropdown/select class, budget `150–250ms`, so `220ms` in. The exit uses a faster opacity (`160ms`) because the deliberate act is opening; closing is the system responding and should snap.

## Repo conventions to follow

- Single flat stylesheet `src/styles.css`; **no CSS nesting anywhere** in this file. Write flat top-level rules.
- The `is-expanded` class already exists on the card and needs no change — see `src/components/ExerciseList.tsx:69`:
  ```tsx
  className={isExpanded ? 'exercise-card is-expanded' : 'exercise-card'}
  ```
  This is the exemplar for state-driven class naming in this repo (`is-*` prefix, also used by `.tag-chip.is-selected` at `src/styles.css:211` and `.tab-bar button.is-active` at `src/styles.css:445`).
- `.exercise-card` already sets `overflow: hidden` (`src/styles.css:251`) — do not add it again.
- `aria-expanded={isExpanded}` is already correct on the toggle button (`src/components/ExerciseList.tsx:75`). Leave it.

## Steps

1. In `src/components/ExerciseList.tsx`, replace the `{isExpanded && ( … )}` block (lines 101-147) with the always-mounted markup from the Target section. The `inert={!isExpanded || undefined}` attribute is required — without it the Edit, Delete, and "Open video" controls stay keyboard-focusable and screen-reader-visible while the card is collapsed. React 19 (this repo is on `react ^19.2.8`) supports `inert` as a boolean prop; passing `undefined` rather than `false` keeps the attribute off the DOM entirely.
2. In `src/styles.css`, add the `.card-details-wrap`, `.exercise-card.is-expanded .card-details-wrap`, and `.card-details-clip` rules immediately after the existing `.card-details` rule (currently ends line 324). Do not edit the existing `.card-details` rule.
3. In `src/styles.css`, inside the existing `@media (prefers-reduced-motion: reduce)` block (line 715), append the reduced-motion override from the Target section.

## Boundaries

- Do NOT modify the existing `.card-details` rule at `src/styles.css:321-324`. Its `padding` and `border-top` must stay on that element; moving them is what the `.card-details-clip` layer exists to avoid.
- Do NOT change the `.notes-preview` conditional at `src/components/ExerciseList.tsx:95-97`. The preview correctly disappears when expanded; animating that swap is out of scope.
- Do NOT change any of the children inside `.card-details` — same elements, same props, same order.
- Do NOT convert this to `height: auto` with `interpolate-size`, and do NOT reach for a JS animation library. The grid-row technique is the chosen approach.
- Do NOT add new dependencies.
- If a step doesn't match the code you find (drift since commit a3e8b75), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run build` (runs `tsc -b && vite build`) must pass — this is the real check here, since the TSX change could introduce a type error on the `inert` prop. `npm run lint` reports no new problems.
- **Feel check**: run `npm run dev` and load the library with at least four exercises, at least one with long notes:
  - Expand a card in the middle of the list. The cards below must slide down, not jump. Watch the *bottom* of the list, not the card you tapped — that is where a teleport is most visible.
  - Collapse it. The close must feel quicker than the open.
  - **Interruptibility**: tap the same card open/closed rapidly, five or six times. Because these are CSS transitions rather than keyframes, the motion must retarget smoothly from wherever it is. If it visibly restarts from fully-closed each time, something has been implemented with `@keyframes` — that is wrong, fix it.
  - Check the collapsed state carefully: there must be **no** stray 1px line or leftover padding gap under a collapsed card. If you see one, `overflow: hidden; min-height: 0` has been applied to `.card-details` instead of `.card-details-clip`.
  - In DevTools → Animations panel at 10% playback, confirm the opacity finishes at or before the row expansion, so text never appears to arrive after its container.
  - **Keyboard/a11y**: collapse all cards, then press Tab repeatedly through the list. Focus must never land on a hidden Edit, Delete, or "Open video" control. This is the single most likely defect in this change.
  - In DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce", expand a card: it should fade in at full height with no size animation.
- **Done when**: expanding and collapsing are both animated, rapid toggling never restarts from zero, collapsed cards show no residual gap, and Tab order skips collapsed card contents.
