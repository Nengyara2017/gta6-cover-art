// Vice Coast Cover Studio 2 — entry program (Node 22, standard library only).
//
// The repository holds the app as plain static files under app/ and the
// screenshots under screenshots/. This program hands them in: it copies
// app/ to the output directory, decodes the screenshots there, and writes
// /output/dossier.json with the vendored make.fun library, exactly as the
// kit's starter does. Outside the grader, MAKEFUN_OUTPUT_DIR stands in
// for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Why screenshots are base64 text: the GitHub push path carries text files
// only, so a binary JPEG cannot be pushed. Each screenshot is stored in
// the repository as one single line of base64 (screenshots/<name>.jpg.b64),
// taken by the app itself, and this program decodes it back to the exact
// JPEG bytes when it hands the entry in. The gate and the judge therefore
// see real PNG/JPEG screenshots, byte for byte the ones the app made.
// A real .jpg/.png in screenshots/ is copied through unchanged.
//
// The dossier is the text the judge reads, so the program refuses to write
// an output the gate would refuse: more than 4 screenshots, a screenshot
// over 256 KiB, app/ over 993 files or 48 MiB, or a path under app/ over
// 1000 bytes. Those are the scorer's own caps from the kit's reference data.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function countTree(root) {
  let files = 0;
  let bytes = 0;
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop();
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const info = statSync(full);
      if (info.isDirectory()) {
        files += 1;
        stack.push(full);
      } else if (info.isFile()) {
        files += 1;
        bytes += info.size;
        const rel = relative(root, full);
        if (Buffer.byteLength(rel, 'utf8') > 1000) {
          throw new Error(`app path over 1000 bytes: ${rel}`);
        }
      }
    }
  }
  return { files, bytes };
}

// Decode the repository's screenshots into outDir: a *.jpg.b64 / *.png.b64
// file becomes the JPEG/PNG it encodes; a real image is copied as-is.
function handInScreenshots(repoDir, outDir) {
  if (!existsSync(repoDir)) throw new Error('screenshots/ is missing');
  mkdirSync(outDir, { recursive: true });
  const names = readdirSync(repoDir).filter((name) => !name.startsWith('.'));
  let written = 0;
  for (const name of names) {
    const full = join(repoDir, name);
    if (!statSync(full).isFile()) continue;
    const encoded = name.match(/^(.*\.(?:jpg|jpeg|png))\.b64$/);
    if (encoded) {
      const text = readFileSync(full, 'utf8').replace(/\s+/g, '');
      writeFileSync(join(outDir, encoded[1]), Buffer.from(text, 'base64'));
      written += 1;
    } else if (/\.(?:jpg|jpeg|png)$/i.test(name)) {
      cpSync(full, join(outDir, name));
      written += 1;
    }
  }
  if (written < 3 || written > 4) {
    throw new Error(`need 3 or 4 screenshots, found ${written}`);
  }
  for (const name of readdirSync(outDir)) {
    const info = statSync(join(outDir, name));
    if (!info.isFile() || info.size > 262144) {
      throw new Error(`screenshot ${name} is not a file under 256 KiB`);
    }
  }
  return written;
}

const appTree = countTree(join(here, 'app'));
if (appTree.files > 993) throw new Error(`app/ holds ${appTree.files} files, over 993`);
if (appTree.bytes > 50331648) throw new Error('app/ is over 48 MiB');

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
const shots = handInScreenshots(join(here, 'screenshots'), join(out, 'screenshots'));

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

console.log(`handed in app/ (${appTree.files} files, ${appTree.bytes} bytes) + ${shots} screenshots`);
