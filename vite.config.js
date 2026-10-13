import { defineConfig } from 'vite';

export default defineConfig({
  // Relative paths, so the built game also works when it is hosted in a sub-folder
  // (GitHub Pages, itch.io) and not only at the top of a site
  base: './',
});
