// Neon Vice Studio — the entry program for make.fun gta6-cover-art-01.
//
// It runs on Node 22 with the standard library only. It takes the app/ folder
// and the screenshots/ folder that sit beside this file, copies them into the
// output directory the grader provides, and writes the dossier.json the judge
// reads, using the vendored make.fun library (vendor/makefun-app.ts).
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(here, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The caps are the competition's own gate limits (reference/gate.json): the
// dossier text is capped at 160 KiB, at most 4 screenshots of at most 256 KiB
// each, and app/ stays under 993 files and 48 MiB with no path over 1,000
// bytes. Those bounds keep /output inside the platform's 1,000-entry,
// 64 MiB ceiling alongside dossier.json.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.log(`Neon Vice Studio handed in to ${outDir}`);
