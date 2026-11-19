// Vice Coast Cover Studio 2 — hand-in program for gta6-cover-art-01.
// Node 22, standard library only. Copies app/ and screenshots/ from beside
// this file to /output (or MAKEFUN_OUTPUT_DIR outside the grader) and writes
// /output/dossier.json with the vendored make.fun library.
//
// The repository stays text-only: screenshots ship as single-line base64
// text files (*.jpg.b64) because the push path cannot carry binaries. This
// program decodes each one into the real JPEG the gate and the judge read,
// so the output is identical on every run.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });

const shotDir = join(out, 'screenshots');
mkdirSync(shotDir, { recursive: true });
const srcShots = join(here, 'screenshots');
if (existsSync(srcShots)) {
  for (const file of readdirSync(srcShots).sort()) {
    if (!file.endsWith('.jpg.b64')) continue;
    const name = file.slice(0, -'.b64'.length);
    const text = readFileSync(join(srcShots, file), 'utf8').trim();
    writeFileSync(join(shotDir, name), Buffer.from(text, 'base64'));
  }
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the bytes; the others refuse an entry the scorer would refuse.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
