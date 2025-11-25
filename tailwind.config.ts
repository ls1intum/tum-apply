import type { Config } from 'tailwindcss';

// Tailwind CSS v4 Configuration
// Note: In v4, theme colors are primarily defined using the @theme directive in CSS files.
// See: src/main/webapp/content/scss/_tokens.scss for color token definitions.

const config: Config = {
  content: ['./src/main/webapp/**/*.{html,ts}'],
  darkMode: ['selector', '.tum-apply-dark-mode'],
};

export default config;
