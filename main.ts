// Vice Coast Cover Studio — entry program for make.fun's gta6-cover-art-01.
//
// Node 22, standard library only. It assembles the hand-in in /output:
//   1. copies the static app (app/) and the screenshots (screenshots/),
//   2. writes /output/dossier.json with the kit's buildDossier library.
//
// The grader runs this program twice in a fresh container with no network,
// so it must be deterministic: same input files, same output bytes.
//
// Local check:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app itself with `node serve.ts` (http://localhost:8080).

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fresh output tree: app/ first, then the screenshots beside it.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), {
    recursive: true,
  });
}

// Caps mirror the gate so a hand-in that would be refused fails loudly here
// instead of on the server: 160 KiB of dossier text, at most 4 screenshots of
// at most 256 KiB, app/ within 993 entries / 48 MiB / 1000-byte paths.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
