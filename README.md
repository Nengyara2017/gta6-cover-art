# Vice Coast Cover Studio 2

[![make.fun](https://img.shields.io/badge/make.fun-gta6--cover--art--01-ff2e88)](https://make.fun/c/gta6-cover-art-01)

Turn your photo into GTA-style cover art: the multi-panel poster look, bold
caption lettering and a Vice City sunset or neon colour grade, exported as a
PNG to share.

## What it does

- **6 layouts** — Vice Grid (hero + 2), Nine Panel (3×3), Full Bleed,
  Tilted Snaps (rotated polaroids), Sunset Strip (wide hero + 3-panel strip),
  Comic Bands (diagonal GTA loading-screen bands).
- **7 colour grades** — Sunset, Neon Night, Gold Hour, Teal Vice, Magenta
  Rush, Noir Vice, Pastel Dawn. Gradient-map + duotone canvas grades.
- **4 one-click presets** — Lucia Nights, Jason Drive, Vice Sunset, Neon
  Heat. Layout + grade + caption in one tap: photo to PNG in a click.
- **4 export sizes** — 1080×1080, 1080×1350, 1920×1080, 1080×1920, plus
  **Export all sizes** (all four PNGs at once).
- **Per-panel controls** — click to select, drag to pan, scroll to zoom,
  sliders for zoom / pan X / pan Y, rotate 90°, flip horizontal, per-panel
  photo picker, "one photo fills all panels" toggle.
- **Typography** — condensed heavy title with sunset-gradient fill, dark
  outline and hard offset shadow (auto-fits the cover width), neon script
  subtitle with glow, "VICE CITY — EST. 2026" badge ribbon, halftone dots,
  a 5-star heat meter, grain + vignette toggles.
- **Undo / redo** — Ctrl+Z / Ctrl+Y for every edit.
- **Photos** — upload your own (multi-file, drag & drop) or use the four
  built-in sample scenes, painted in code: Boulevard Sunset, Neon Street,
  Pier Day, Rooftop Dusk. No binary assets anywhere in the repo.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Static files under `app/` only, no network requests, no build step. Works
offline in desktop Chrome. Original art, painted in code — no Rockstar logo,
artwork or font.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22 stdlib only) copies `app/` and `screenshots/` to
`/output` and writes `/output/dossier.json`. Screenshots ship in the repo as
single-line base64 text (`screenshots/*.jpg.b64`) and are decoded to real
JPEGs at hand-in, so the repository stays text-only.

## License

MIT — see `LICENSE`.
