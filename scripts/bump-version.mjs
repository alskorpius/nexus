#!/usr/bin/env node
// Bump the app version in every file that carries it, keeping them in sync:
//   package.json, package-lock.json, src-tauri/tauri.conf.json,
//   src-tauri/Cargo.toml, src-tauri/Cargo.lock
//
// Usage: npm run bump 0.2.0   (or: node scripts/bump-version.mjs 0.2.0)

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const version = process.argv[2];

if (!version || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error('Usage: npm run bump <semver>   e.g. npm run bump 0.2.0');
  process.exit(1);
}

const changed = [];

function updateJson(relPath, mutate) {
  const path = resolve(root, relPath);
  const original = readFileSync(path, 'utf8');
  const eol = original.includes('\r\n') ? '\r\n' : '\n';
  const data = JSON.parse(original);
  mutate(data);
  let out = JSON.stringify(data, null, 2) + '\n';
  if (eol === '\r\n') out = out.replace(/\n/g, '\r\n');
  writeFileSync(path, out);
  changed.push(relPath);
}

function updateText(relPath, pattern, replacement) {
  const path = resolve(root, relPath);
  const text = readFileSync(path, 'utf8');
  if (!pattern.test(text)) {
    console.error(`ERROR: version pattern not found in ${relPath} — file format changed?`);
    process.exit(1);
  }
  writeFileSync(path, text.replace(pattern, replacement));
  changed.push(relPath);
}

updateJson('package.json', (pkg) => {
  pkg.version = version;
});

updateJson('package-lock.json', (lock) => {
  lock.version = version;
  if (lock.packages && lock.packages['']) lock.packages[''].version = version;
});

updateJson('src-tauri/tauri.conf.json', (conf) => {
  conf.version = version;
});

// Only the [package] version is on its own line; dependency versions are inline tables.
updateText('src-tauri/Cargo.toml', /^version = "[^"]+"$/m, `version = "${version}"`);

updateText(
  'src-tauri/Cargo.lock',
  /(\[\[package\]\]\r?\nname = "nexus"\r?\nversion = ")[^"]+(")/,
  `$1${version}$2`
);

console.log(`Version bumped to ${version}:`);
for (const f of changed) console.log(`  - ${f}`);
console.log(`
Next steps:
  git add -A && git commit -m "Release v${version}"
  git tag v${version}
  git push origin main v${version}
The tag push triggers .github/workflows/release.yml (draft GitHub Release).`);
