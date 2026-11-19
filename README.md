# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Nengyara2017/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Nengyara2017/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice Coast Cover Studio** — turn any photo and a caption into GTA-poster-style
cover art, offline, in your browser. Four multi-panel layouts, five Vice City
colour grades, per-panel crop and positioning, bold caption lettering, and PNG
export in the common post sizes 1080×1080, 1080×1350 and 1920×1080.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: serve `app/` with any static file server and open
`app/index.html` in desktop Chrome. Every script, font and sample image is a
file under `app/`; your photos are read on your own machine and never uploaded.

## How it works

1. Drop in one or more photos (or try a built-in sample).
2. Pick a layout: **Vice Grid** (hero + two), **Nine Panel** (3×3), **Full Bleed**,
   or **Tilted Snaps**.
3. Click a panel to select it, drag to pan, scroll to zoom — or use the
   zoom / pan sliders. Each panel can hold its own photo.
4. Pick a grade (**Sunset**, **Neon Night**, **Gold Hour**, **Teal Vice**,
   **Noir**), edit the title, subtitle, badge and heat stars, then hit
   **Export PNG**.

Everything decorative — the procedural sun, palm silhouettes, skyline,
halftone title band and film grain — is drawn in code. No Rockstar logo,
artwork or font is used anywhere; the bundled Anton and Pacifico fonts ship
under the SIL Open Font License (see `app/fonts/OFL.txt`).

## Layout

- `app/` — the static web app (`index.html`, `style.css`, `src/cover.js`
  the render engine, `src/main.js` the editor, `src/shots.js` the screenshot
  mode, `fonts/`, `samples/`).
- `screenshots/` — four screenshots of the real app and the covers it exports.
- `main.ts` — copies `app/` and `screenshots/` to `/output` and writes
  `/output/dossier.json` (Node 22, standard library only).
- `serve.ts` — tiny static server for local development.
- `vendor/makefun-app.ts` — the kit's dossier library, unchanged.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=1wdmergd&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
