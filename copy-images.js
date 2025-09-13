#!/usr/bin/env node

import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';

const imagesToCopy = [
  { from: 'pumpfun.png', to: 'public/pumpfun.png' },
  { from: 'bonkfun.png', to: 'public/bonkfun.png' }
];

console.log('Copying missing images to public folder...');

imagesToCopy.forEach(({ from, to }) => {
  if (existsSync(from)) {
    try {
      copyFileSync(from, to);
      console.log(`✅ Copied ${from} to ${to}`);
    } catch (error) {
      console.error(`❌ Failed to copy ${from}:`, error.message);
    }
  } else {
    console.log(`⚠️  Source file ${from} not found`);
  }
});

console.log('Image copy complete!');
