const path = require('path');
const fs = require('fs-extra');

const src = path.join(__dirname, '..', 'node_modules', 'jest-preset-angular');
const dest = path.join(
  __dirname,
  '..',
  'node_modules',
  '@angular-builders',
  'jest',
  'node_modules',
  'jest-preset-angular'
);

fs.copy(src, dest, { overwrite: true })
  .catch((err) => {
    console.error('Error copying jest-preset-angular:', err);
    process.exit(1);
  });
