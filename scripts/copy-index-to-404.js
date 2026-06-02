#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const dist = path.resolve(process.cwd(), 'dist');
const index = path.join(dist, 'index.html');
const dest = path.join(dist, '404.html');

try {
  await fs.promises.copyFile(index, dest);
  console.log('Copied dist/index.html → dist/404.html');
} catch (err) {
  console.error('Failed to copy index.html to 404.html:', err.message);
  process.exit(1);
}
