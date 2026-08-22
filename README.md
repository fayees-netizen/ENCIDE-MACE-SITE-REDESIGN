# ENCIDE MACE — Website

Landing page for ENCIDE, the coding club of Mar Athanasius College of Engineering.

## Project structure

```
encide-mace/
├── index.html          # Page markup, links css/style.css + js/*.js
├── css/
│   └── style.css       # All site styles (extracted from the original inline <style>)
├── js/
│   ├── team-data.js    # Team roster array (window.TEAM_DATA) — loads before main.js
│   ├── main.js         # Nav, modal, FAQ accordion, counters, countdown,
│   │                    # events/testimonials marquees, team card rendering, GSAP reveals
│   └── hero-3d.js       # ES module: Three.js hero canvas (postprocessing + custom shader)
├── assets/
│   └── team/            # Team member photos (see note below)
├── .gitignore
└── README.md
```

This was split out of a single self-contained HTML file so it can be committed
to GitHub as normal source files instead of one giant page (easier diffs,
proper syntax highlighting, and no giant inline `<style>`/`<script>` blocks).

## ⚠️ One manual step before this is 100% complete

The original file embedded each team member's photo as a base64 `data:` URI
directly inside the JS. That's **not** good practice for a git repo (bloats
the repo size and every diff), so `js/team-data.js` currently has placeholder
strings like:

```js
img: 'data:image/jpeg;base64,REPLACE_WITH_DIRECTOR_PHOTO_BASE64',
```

To finish the conversion:

1. Export each team member's photo as a real image file into `assets/team/`
   (e.g. `assets/team/amrita-suresh.jpg`).
2. In `js/team-data.js`, replace each placeholder `img` value with the
   relative path, e.g.:
   ```js
   img: 'assets/team/amrita-suresh.jpg',
   ```

If you'd like, paste (or re-upload) the original team photos and I can do
this extraction + rewire for you automatically.

## Running locally

No build step — it's static HTML/CSS/JS. Serve the folder with any static
server, e.g.:

```bash
cd encide-mace
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Dependencies (all via CDN, no npm install needed)

- [Tailwind CSS](https://tailwindcss.com/) (CDN build)
- [GSAP](https://gsap.com/) + ScrollTrigger
- [Three.js](https://threejs.org/) r160 (loaded via `<script type="importmap">` in `index.html`)
- Google Fonts: Space Grotesk, Inter, JetBrains Mono

## Suggested git commit

```bash
cd encide-mace
git init
git add .
git commit -m "Split ENCIDE MACE site into index.html / css / js"
```
