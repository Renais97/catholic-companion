# Catholic Companion — GitHub Pages setup

This folder is ready to publish directly with GitHub Pages. Keep all files at the repository root.

## Upload

1. Create a new GitHub repository, for example `catholic-companion`.
2. Upload **all files in this folder** to the root of the repository.
3. Commit the files to the `main` branch.
4. Open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select **main** and **/(root)**, then save.
7. When GitHub reports that the site is live, open the site URL on your phone.

## Install on Android

1. Open the published site in Chrome.
2. Open the Chrome menu (⋮).
3. Choose **Install app** or **Add to Home screen**.
4. Confirm installation.

## Files

- `index.html` — Catholic Companion app
- `manifest.webmanifest` — installable-app metadata
- `service-worker.js` — offline/app-shell caching
- `icon-192.png` and `icon-512.png` — app icons
- `.nojekyll` — tells GitHub Pages to serve the files as a plain static site

The app uses relative paths, so it works from a GitHub Pages project URL such as:

`https://USERNAME.github.io/catholic-companion/`
