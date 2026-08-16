# Exercise Library

A mobile-first Progressive Web App (PWA) for keeping exercise names, tags, execution notes, and source videos. It is designed for installation on an iPhone home screen and keeps all exercise data on that device.

## Run locally

Requirements: Node.js 22 or newer and npm.

```sh
npm install
npm run dev
```

Open the URL Vite prints. To verify the production bundle:

```sh
npm run build
npm run preview
```

The production app uses `/exercise-tracker/` as its base path because GitHub Pages serves project sites below the account domain rather than at `/`.

## Data and backups

Exercises are stored in the browser's `localStorage` as versioned JSON. They are not committed to this repository or sent to a server. Use **Backup & restore** in the app to download or copy a JSON backup.

Removing the installed home-screen app can remove its local data. Export a backup before doing so.

## Deploy to GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds and deploys pushes to `main`. Before it can succeed:

1. Make the GitHub repository public, or choose another host if it must remain private.
2. In the repository's **Settings → Pages**, select **GitHub Actions** as the source.
3. Merge or push the app to `main`.

The expected public URL is `https://lucaalv.github.io/exercise-tracker/`.
