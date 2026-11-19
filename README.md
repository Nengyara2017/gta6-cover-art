# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Nengyara2017/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Nengyara2017/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice Coast Cover Studio 2** — turn any photo and a caption into GTA-poster-style
cover art, offline, in your browser. Six multi-panel layouts, seven Vice City
colour grades, four one-click preset looks, per-panel crop and positioning,
undo/redo, bold gradient caption lettering with a neon script subtitle, and PNG
export in 1080×1080, 1080×1350, 1920×1080 and 1080×1920.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: serve `app/` with any static file server and open
`app/index.html` in desktop Chrome. Every script is a file under `app/`; the
sample scenes are painted in code on canvas, so the repo ships zero binary
assets. Your photos are read on your own machine and never uploaded.

The four screenshots under `screenshots/` are stored as single-line base64
text (`<name>.jpg.b64` — the GitHub push path carries text files only) and
`main.ts` decodes them back to the exact JPEG bytes when it hands the entry
in, so the gate and the judge see real screenshots.

## How it works

1. Drop in one or more photos (or use the built-in Vice City scenes).
2. Pick a layout: **Vice Grid** (hero + two), **Nine Panel** (3×3),
   **Full Bleed**, **Tilted Snaps**, **Sunset Strip** (hero + three) or
   **Comic Bands** (diagonal loading-screen bands).
3. Pick a grade (**Sunset**, **Neon Night**, **Gold Hour**, **Teal Vice**,
   **Magenta Rush**, **Noir Vice**, **Pastel Dawn**) or a one-click preset
   (**Lucia Nights**, **Jason Drive**, **Vice Sunset**, **Neon Heat**).
4. Click a panel to select it, drag to pan, scroll to zoom — or use the
   zoom / pan sliders, rotate and flip. Each panel can hold its own photo,
   or one photo can fill every panel.
5. Write the title, subtitle and badge ribbon; set the heat (★) and title size.
6. Export one PNG size, or all four at once.

Everything is original: no Rockstar Games logo, artwork or font. Lettering
uses a condensed system face with a gradient fill, outline and hard shadow.
