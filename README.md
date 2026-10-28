# Mahdi Bel Haj Said — portfolio

A static one-page site (no build step). Open `index.html` through any static web server.

## Files

- `index.html` — page head (SEO tags) and the page markup inside `<template id="site-template">`
- `css/styles.css` — animations, hover states and responsive rules
- `js/site.js` — all copy (EN/FR), state and interactions (terminal, Ask my CV, chess, skills graph…)
- `js/dc-runtime.js` — small renderer that fills the template with values from `site.js`, using Preact
- `js/vendor/preact.min.js` — Preact 10.24.3 (MIT, see `preact.LICENSE`)
- `assets/img`, `assets/docs` — portrait, certificates, letters, CVs and transcripts

To change text, edit the `STRINGS` / `TERM` objects in `js/site.js`. To swap a CV, replace the PDF in `assets/docs` with one of the same name.

## Run locally

```bash
python -m http.server 8765
```

Then open http://localhost:8765.

## Publish for free on GitHub Pages

1. On github.com, create a **public** repository named exactly `Mahdi-Bel-Haj-Said.github.io`.
2. Upload the contents of this folder (Add file → Upload files, drag everything in), and commit.
3. In the repository: Settings → Pages → Source: "Deploy from a branch", Branch: `main`, folder `/ (root)`, then Save.
4. After a minute or two the site is live at https://mahdi-bel-haj-said.github.io/

Every later commit to `main` redeploys automatically. A custom domain can be added under Settings → Pages.
