# 003 — Give pushed subpages an entrance

- **Status**: DONE
- **Commit**: a3e8b75
- **Severity**: MEDIUM
- **Category**: Missed opportunities (spatial consistency)
- **Estimated scope**: 1 file (`src/styles.css`), ~20 lines

## Prerequisite

**Plan `001-press-feedback.md` must be executed first.** It defines `--ease-out` in the `:root` block of `src/styles.css`. If `--ease-out: cubic-bezier(0.23, 1, 0.32, 1);` is not present in `src/styles.css`, STOP and execute plan 001 first.

## Problem

`src/App.tsx` is a hand-rolled view switcher — there is no router. Navigating to a subpage swaps the entire rendered tree in one frame:

```tsx
/* src/App.tsx:84-103 — current (abridged) */
if (view.name === 'add' || view.name === 'edit') {
  return (
    <ExerciseForm … />
  )
}

if (view.name === 'backup') {
  return (
    <BackupPanel … />
  )
}
```

Tapping "Add exercise", the backup icon, a category, or the settings gear replaces the whole screen instantly. Nothing communicates that the user moved *into* something, and nothing bridges the swap — the previous screen simply ceases to exist mid-blink.

The four pushed subpages and their root classes:

| Page | Root class | Source |
| --- | --- | --- |
| Exercise add/edit form | `.editor-page` | `src/components/ExerciseForm.tsx:54` |
| Backup & restore | `.backup-page` | `src/components/BackupPanel.tsx:98` |
| Category settings | `.category-settings-page` | `src/components/CategorySettings.tsx:31` |
| Single category | `.category-page` | `src/components/CategoryView.tsx:29` |

## Target

An enter-only transition on the four pushed subpages, using `@starting-style` so no JavaScript and no mount-flag state is needed.

Write this exactly as shown — the settled state is `opacity: 1; transform: translateY(0);`, and the `@starting-style` block holds the pre-entry state.

```css
/* target — new block in src/styles.css, placed after the
   .editor-page/.backup-page/.category-settings-page rule (currently ends line 553) */

.editor-page,
.backup-page,
.category-settings-page,
.category-page {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 200ms var(--ease-out),
    transform 200ms var(--ease-out);
}

@starting-style {
  .editor-page,
  .backup-page,
  .category-settings-page,
  .category-page {
    opacity: 0;
    transform: translateY(8px);
  }
}
```

Reduced-motion handling — append inside the **existing** block at `src/styles.css:715`:

```css
/* target — inside the existing @media (prefers-reduced-motion: reduce) block */
.editor-page,
.backup-page,
.category-settings-page,
.category-page {
  transition: opacity 200ms var(--ease-out);
  transform: none;
}
```

Keeps the fade, drops the travel.

`8px` is deliberately small: this is a page-level entrance the user triggers on purpose, so the motion should read as arrival, not as a slide-in. `200ms` sits inside the `150–250ms` budget.

## Repo conventions to follow

- Single flat stylesheet `src/styles.css`; **no CSS nesting anywhere** in this file. That is why `@starting-style` is written as a top-level at-rule wrapping the selector, rather than nested inside the rule.
- Exemplar for a comma-separated page-class selector already in this file — `src/styles.css:549-553`:
  ```css
  .editor-page,
  .backup-page,
  .category-settings-page {
    width: min(100%, 640px);
  }
  ```
  Your new rule extends this same group with `.category-page`.
- All four page components already put their root class on `<main className="page-shell …">`. No markup change is needed.

## Steps

1. In `src/styles.css`, add the settled-state rule for the four page classes, immediately after the existing `.editor-page, .backup-page, .category-settings-page` rule that ends at line 553.
2. In `src/styles.css`, directly below that, add the top-level `@starting-style` block from the Target section.
3. In `src/styles.css`, inside the existing `@media (prefers-reduced-motion: reduce)` block (line 715), append the reduced-motion override from the Target section.

## Boundaries

- **Do NOT add `.library-page` or `.categories-page` to this selector list.** Two independent reasons, both hard blockers:
  1. They are the two tab roots. Switching tabs is this app's core navigation (`src/components/TabBar.tsx`), hit constantly, and animating it would put a 200ms delay in front of the most-repeated action in the product.
  2. `.library-page` contains the `position: fixed` FAB — `<button className="fab">` is rendered *inside* `<main className="page-shell library-page has-tab-bar">` at `src/components/LibraryView.tsx:124`. A `transform` on an ancestor establishes the containing block for fixed-position descendants, so adding `.library-page` here would break the FAB's viewport pinning.
- Do NOT touch `src/App.tsx` or any component file. This is CSS-only.
- Do NOT attempt to add an *exit* animation. The old view unmounts synchronously in `src/App.tsx`; animating exits would require presence-tracking state and is out of scope.
- Do NOT add new dependencies.
- If a step doesn't match the code you find (drift since commit a3e8b75), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run build` completes without error. `npm run lint` reports no new problems.
- **Feel check**: run `npm run dev`:
  - Tap "Add exercise", the backup icon (⇩), the settings gear (⚙), and a category card. Each destination should rise and fade in slightly. It should feel like arriving, not like a slide transition.
  - **Regression check on the FAB**: return to the Exercises tab and scroll the list. The "Add exercise" button must stay pinned to the bottom-right of the viewport and must not scroll with the content. If it scrolls away, `.library-page` was wrongly added to the selector list — remove it.
  - **Regression check on tab switching**: toggle Exercises ↔ Categories several times. Neither tab root should animate. Any fade here means the selector list is too broad.
  - Note that the `.category-page` does animate on entry while the `.categories-page` tab root does not — that asymmetry is intentional and correct: one is a push, the other is a tab.
  - In DevTools → Animations panel at 10% playback, confirm the page eases *out* (fast start, gentle settle).
  - In DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce", confirm subpages fade with no vertical travel.
- **Done when**: all four pushed subpages animate in, both tab roots do not, and the FAB remains viewport-fixed on the library screen.
