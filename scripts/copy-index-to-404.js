#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const dist = path.resolve(process.cwd(), 'dist');
const index = path.join(dist, 'index.html');
const dest = path.join(dist, '404.html');
const nojekyll = path.join(dist, '.nojekyll');

try {
  await fs.promises.copyFile(index, dest);
  await fs.promises.writeFile(nojekyll, '');
  console.log('Copied dist/index.html → dist/404.html and created dist/.nojekyll');
} catch (err) {
  console.error('Failed to finalize dist output:', err.message);
  process.exit(1);
}
