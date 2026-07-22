# Valentyn Fiedietsov — CV / Business-card site

A single-page personal site for a Senior DevOps / SRE engineer, built from the
content of `cv-valentyn-fiedietsov-refinedscience-2026-07-14.pdf`.

**Visual language:** dark "laboratory" theme, scientific — geometric motifs
(diamonds / node-chains), cyan + violet accents, mono typography for an
engineering feel. A lightweight canvas physics graph (diamond nodes connected
by lines, reacting to the cursor) runs behind the content.

**Stack:** plain `index.html` + `styles.css` + `graph.js`. No build step,
no dependencies. Fully static — host it anywhere.

## Files

```
index.html        # page markup + CV content
styles.css        # dark theme, diamonds, responsive, print
graph.js          # canvas physics node-graph + reveal-on-scroll
assets/
  cv-valentyn-fiedietsov.pdf   # downloadable CV (copied from source PDF)
```

## Local preview

Any static server works. Pick one:

```bash
# Python (built-in)
python3 -m http.server 8000
# then open http://localhost:8000

# or Node
npx serve .
```

Opening `index.html` directly via `file://` also works, but a local server
is recommended so the canvas and assets behave like in production.

## Deploy to GitHub Pages

1. Create a new GitHub repository (e.g. `cv-web`) and push these files:
   ```bash
   git init
   git add .
   git commit -m "Initial CV site"
   git branch -M main
   git remote add origin git@github.com:<your-user>/cv-web.git
   git push -u origin main
   ```
2. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Select the `main` branch and `/ (root)` folder, then **Save**.
4. The site goes live at `https://<your-user>.github.io/cv-web/` within ~1 min.

> If you'd rather keep it in a subfolder of an existing repo (e.g.
> `username.github.io/cv/`), move all files into that subfolder — all asset
> paths are relative, so it works without changes.

### Optional: GitHub Actions deploy

If you prefer CI-driven deploys over the branch source, add
`.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions:
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: . }
      - id: deployment
        uses: actions/deploy-pages@v4
```

Then set **Settings → Pages → Source: GitHub Actions**.

## Updating the CV

Replace `assets/cv-valentyn-fiedietsov.pdf` with the new PDF (keep the same
filename, or update the two `download` links in `index.html`). Update the text
content in `index.html` to match.

## Accessibility & performance notes

- Honors `prefers-reduced-motion`: the graph renders a single static frame
  and scroll-reveal is skipped.
- The canvas pauses when the tab is hidden.
- Node count scales with viewport area and is capped for performance.
- Print stylesheet produces a clean light-on-white PDF directly from the
  browser (Ctrl/Cmd+P).