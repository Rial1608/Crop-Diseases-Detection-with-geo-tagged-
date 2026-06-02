#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create necessary directories
const srcDir = path.join(__dirname, 'src');
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir, { recursive: true });
}
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('✓ Frontend structure created');
