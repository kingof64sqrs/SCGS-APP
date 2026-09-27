/**
 * Vercel's CLI refuses to upload any directory named "node_modules", but the
 * Expo web export puts icon fonts under assets/node_modules/... — so every
 * icon 404s once deployed. Rename the folder to assets/vendor and patch all
 * references in the exported bundle.
 *
 *   node scripts/fix-web-assets.mjs <export-dir>
 */
import { existsSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('usage: node scripts/fix-web-assets.mjs <export-dir>');
  process.exit(1);
}

const from = path.join(dir, 'assets', 'node_modules');
const to = path.join(dir, 'assets', 'vendor');
if (existsSync(from)) {
  rmSync(to, { recursive: true, force: true });
  renameSync(from, to);
}

const PATCH_EXT = new Set(['.js', '.html', '.css', '.json']);
function walk(d) {
  for (const name of readdirSync(d)) {
    const p = path.join(d, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (PATCH_EXT.has(path.extname(p))) {
      const src = readFileSync(p, 'utf8');
      if (src.includes('assets/node_modules')) {
        writeFileSync(p, src.replaceAll('assets/node_modules', 'assets/vendor'));
      }
    }
  }
}
walk(dir);
console.log(`fixed web assets in ${dir}`);
