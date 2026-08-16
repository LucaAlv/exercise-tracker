# 005 — Announce backup status messages and the import prompt

- **Status**: TODO
- **Commit**: a3e8b75
- **Severity**: LOW
- **Category**: Missed opportunities (state indication)
- **Estimated scope**: 1 file (`src/styles.css`), ~25 lines

## Prerequisite

**Plan `001-press-feedback.md` must be executed first.** It defines `--ease-out` in the `:root` block of `src/styles.css`. If `--ease-out: cubic-bezier(0.23, 1, 0.32, 1);` is not present in `src/styles.css`, STOP and execute plan 001 first.

## Problem

The Backup & restore screen confirms its actions with text that materialises silently, often below the fold on a phone.

After choosing a file, an import prompt appears inside the second panel:

```tsx
/* src/components/BackupPanel.tsx:148-164 — current (abridged) */
{pending && (
  <div className="import-choice">
    <strong>{pending.fileName}</strong>
    <p>
      Contains {pending.data.exercises.length} exercise…
    </p>
    <button className="button button-primary" …>Merge with this device</button>
    <button className="button button-danger" …>Replace everything</button>
  </div>
)}
```

And every action's result renders at the very bottom of the page:

```tsx
/* src/components/BackupPanel.tsx:167-168 — current */
{message && <p className="status-message" role="status">{message}</p>}
{error && <p className="form-error" role="alert">{error}</p>}
```

Both appear with zero transition. On a phone screen this is a genuine usability gap, not just a polish one: tapping "Copy backup to clipboard" (`src/components/BackupPanel.tsx:120`) produces a confirmation the user may never see, because nothing draws the eye to a line of text that simply began existing off-screen. This is data-safety UI — a user who misses the confirmation does not know whether their library is backed up.

## Target

An entrance for both surfaces via `@starting-style`, requiring no JavaScript and no component changes.

```css
/* target — new block in src/styles.css, placed after the existing
   .import-choice p rule (currently ends line 650) */

.import-choice,
.status-message,
.form-error {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 200ms var(--ease-out),
    transform 200ms var(--ease-out);
}

@starting-style {
  .import-choice,
  .status-message,
  .form-error {
    opacity: 0;
    transform: translateY(6px);
  }
}
```

Reduced-motion handling — append inside the **existing** block at `src/styles.css:715`:

```css
/* target — inside the existing @media (prefers-reduced-motion: reduce) block */
.import-choice,
.status-message,
.form-error {
  transition: opacity 200ms var(--ease-out);
  transform: none;
}
```

`200ms` sits inside the `150–250ms` budget. `6px` of travel is smaller than the `8px` used for page entrances in plan 003 — these are inline elements appearing within an existing page, so the motion should be quieter than an arrival.

## Repo conventions to follow

- Single flat stylesheet `src/styles.css`; **no CSS nesting anywhere** in this file. `@starting-style` is written as a top-level at-rule wrapping the selector.
- `.status-message` and `.form-error` already share a declaration block in this file — `src/styles.css:610-618`:
  ```css
  .form-error,
  .status-message {
    margin: 1rem 0 0;
    padding: 0.85rem 1rem;
    border-radius: 12px;
    background: #fae2df;
    color: var(--danger);
    font-weight: 650;
  }
  ```
  This is the exemplar: these two are consistently styled together, and this plan follows that grouping.
- `role="status"` and `role="alert"` are already correct on the message elements. This plan adds visual emphasis on top of announcements that already work; it must not alter them.

## Steps

1. In `src/styles.css`, add the settled-state rule for `.import-choice`, `.status-message`, and `.form-error` immediately after the existing `.import-choice p` rule (currently ends line 650).
2. In `src/styles.css`, directly below that, add the top-level `@starting-style` block from the Target section.
3. In `src/styles.css`, inside the existing `@media (prefers-reduced-motion: reduce)` block (line 715), append the reduced-motion override from the Target section.

## Boundaries

- Do NOT touch `src/components/BackupPanel.tsx` or `src/components/ExerciseForm.tsx`. This is CSS-only.
- Do NOT remove or alter `role="status"` / `role="alert"`, and do NOT add `aria-live` anywhere — the announcements already work and are not this plan's concern.
- Do NOT add an auto-dismiss timer or convert these into toasts. Persistence is deliberate: this is data-safety confirmation the user should be able to re-read.
- Note that `.form-error` is shared with the exercise form (`src/components/ExerciseForm.tsx` renders it for validation errors). Animating it there too is intended and correct — a validation error is a rare, state-indicating moment.
- Do NOT add new dependencies.
- If a step doesn't match the code you find (drift since commit a3e8b75), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run build` completes without error. `npm run lint` reports no new problems.
- **Feel check**: run `npm run dev` and open Backup & restore (the ⇩ icon on the Exercises screen):
  - Tap "Copy backup to clipboard". The green confirmation should rise and fade in at the bottom of the page. It should catch your eye without being loud.
  - Tap "Download JSON backup", then "Copy backup to clipboard" again in quick succession. The message text changes while the element stays mounted, so the second one will swap text without re-animating — this is expected and correct, not a defect.
  - Choose a backup file and confirm the import prompt (`.import-choice`) animates in inside the panel.
  - Trigger the error path: choose a non-JSON file (a `.png` works). The red error message should animate in the same way the success message does.
  - Go to Add exercise, submit with an empty name, and confirm the validation error animates in too.
  - In DevTools → Animations panel at 10% playback, confirm the motion eases out — fast start, gentle settle.
  - In DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce", confirm the messages fade with no vertical travel.
- **Done when**: the import prompt, the status message, the backup error, and the form validation error all animate in, and no component file has been modified (`git diff --name-only` lists only `src/styles.css`).
