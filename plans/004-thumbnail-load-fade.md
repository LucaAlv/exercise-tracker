# 004 — Fade in exercise thumbnails on load

- **Status**: DONE
- **Commit**: a3e8b75
- **Severity**: LOW
- **Category**: Missed opportunities (preventing a jarring change)
- **Estimated scope**: 2 files (`src/components/ExerciseList.tsx`, `src/styles.css`), ~25 lines

## Prerequisite

**Plan `001-press-feedback.md` must be executed first.** It defines `--ease-out` in the `:root` block of `src/styles.css`. If `--ease-out: cubic-bezier(0.23, 1, 0.32, 1);` is not present in `src/styles.css`, STOP and execute plan 004 only after plan 001.

> This is the fiddliest of the six plans and the lowest leverage. It is a reasonable one to defer or skip. Read the Boundaries section before starting — there are two easy ways to make the UI worse here.

## Problem

Exercise cards show a lazily-loaded YouTube thumbnail:

```tsx
/* src/components/ExerciseList.tsx:27-35 — current */
return (
  <img
    className="exercise-thumbnail"
    src={getYoutubeThumbnail(videoId)}
    alt=""
    loading="lazy"
    onError={handleError}
  />
)
```

```css
/* src/styles.css:270-278 — current */
.exercise-thumbnail {
  width: 112px;
  min-width: 112px;
  height: 82px;
  align-self: flex-start;
  border-radius: 13px;
  background: var(--moss-soft);
  object-fit: cover;
}
```

The `background: var(--moss-soft)` acts as a placeholder block. As the user scrolls, each thumbnail hard-cuts from that flat green block to a photograph in a single frame. With `loading="lazy"`, this happens repeatedly down the list, and on a slow connection the pops are staggered and distracting.

## Target

Move the placeholder to a frame element and fade only the image content in. The frame must exist, otherwise fading the `<img>` also fades its own `background` and the placeholder becomes an empty transparent hole — worse than the current behaviour.

Markup — `src/components/ExerciseList.tsx`, replacing the `Thumbnail` return (lines 27-35):

```tsx
/* target */
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
```

CSS — `src/styles.css`, replacing the `.exercise-thumbnail` rule at lines 270-278:

```css
/* target */
.exercise-thumbnail-frame {
  display: block;
  width: 112px;
  min-width: 112px;
  height: 82px;
  overflow: hidden;
  align-self: flex-start;
  border-radius: 13px;
  background: var(--moss-soft);
}

.exercise-thumbnail {
  width: 100%;
  height: 100%;
  opacity: 0;
  object-fit: cover;
  transition: opacity 200ms var(--ease-out);
}

.exercise-thumbnail[data-loaded] {
  opacity: 1;
}
```

The responsive override at `src/styles.css:677-687` must move to the frame:

```css
/* target — replacing the .exercise-thumbnail block inside
   @media (max-width: 430px) at src/styles.css:677 */
.exercise-thumbnail-frame {
  width: 96px;
  min-width: 96px;
  height: 76px;
}
```

**No `prefers-reduced-motion` override is needed for this plan.** A pure opacity fade with no movement is exactly what reduced motion is supposed to keep.

## Repo conventions to follow

- Single flat stylesheet `src/styles.css`; **no CSS nesting anywhere**.
- `.exercise-thumbnail` sits inside `.card-summary`, which is `display: flex` (`src/styles.css:257-268`) — the frame is a flex child, which is why it keeps `min-width` and `align-self: flex-start`.
- The `Thumbnail` component already uses an imperative DOM handler in this exact spot; follow its shape — `src/components/ExerciseList.tsx:21-25`:
  ```tsx
  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget
    const fallback = getYoutubeThumbnail(videoId, 'hqdefault')
    if (image.src !== fallback) image.src = fallback
  }
  ```
- A `<span>` is used for the frame (not a `<div>`) because the surrounding `.card-summary` is a `<button>`, and a `<button>` may only contain phrasing content. **Using a `<div>` here produces invalid HTML and hydration warnings.**

## Steps

1. In `src/components/ExerciseList.tsx`, replace the `return (…)` of the `Thumbnail` component (lines 27-35) with the frame-wrapped markup from the Target section. Keep `handleError` and the early `if (!videoId) return null` guard exactly as they are.
2. In `src/styles.css`, replace the `.exercise-thumbnail` rule (lines 270-278) with the `.exercise-thumbnail-frame` and `.exercise-thumbnail` rules from the Target section.
3. In `src/styles.css`, inside `@media (max-width: 430px)` (line 677), change the `.exercise-thumbnail` selector to `.exercise-thumbnail-frame`. Leave the `.card-actions .button` rule in that media query untouched.

## Boundaries

- Do NOT apply the fade to the `<img>` without adding the frame element. The `<img>`'s own `background: var(--moss-soft)` is the placeholder; fading the image fades the placeholder with it and leaves a transparent hole during load.
- Do NOT forget step 3. Leaving the `max-width: 430px` override pointed at `.exercise-thumbnail` sizes the image to 96px inside a frame still 112px wide, producing a visible mismatch on small phones — which is most of this app's target devices.
- Do NOT use a `<div>` for the frame; the parent is a `<button>` and requires phrasing content.
- Do NOT rely on `onLoad` alone. The `ref` callback checking `image.complete` is required for cached images; without it, revisiting a screen leaves thumbnails permanently invisible.
- Do NOT add a `prefers-reduced-motion` override for this rule.
- Do NOT add new dependencies.
- If a step doesn't match the code you find (drift since commit a3e8b75), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run build` (runs `tsc -b && vite build`) must pass. `npm run lint` reports no new problems.
- **Feel check**: run `npm run dev` with several exercises that have YouTube URLs:
  - DevTools → Network → throttle to "Slow 4G", then hard-reload. Thumbnails should fade up out of the green placeholder block rather than snapping in. The green block must be visible the whole time an image is pending — never a transparent gap.
  - **Cached-image check (the most likely defect)**: with throttling off, reload the page normally, then navigate to a category and back several times. Every thumbnail must be visible. Any permanently blank thumbnail means the `ref` / `image.complete` guard is missing or wrong.
  - **Small-screen check**: set the viewport to 390px wide (iPhone 14 class). The frame and the image must be the same size — 96×76. A photograph inset inside a larger green rectangle means step 3 was skipped.
  - Scroll the list quickly. Fades should be brief enough to feel like the images are simply there; if you are consciously waiting for them, the duration is too long.
  - Enter a deliberately broken video URL and confirm the card still renders sanely (no image, no layout break).
- **Done when**: thumbnails fade from the placeholder on first load, are visible immediately on cached reloads, and the frame matches the image size at both breakpoints.
