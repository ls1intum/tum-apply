const path = require('path');

const fs = require('fs-extra');

const src = path.join(__dirname, '..', 'node_modules', 'jest-preset-angular');
const dest = path.join(__dirname, '..', 'node_modules', '@angular-builders', 'jest', 'node_modules', 'jest-preset-angular');

(async () => {
  try {
    if (await fs.pathExists(src)) {
      await fs.ensureDir(path.dirname(dest));
      await fs.copy(src, dest, { overwrite: true });
      console.log('jest-preset-angular copied successfully.');
    } else {
      console.warn('jest-preset-angular not found, skipping copy.');
    }
  } catch (err) {
    console.warn('Warning: could not copy jest-preset-angular:', err.message);
  }
})();
