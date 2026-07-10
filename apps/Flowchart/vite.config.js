import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures relative paths are used for built assets, so index.html works under file://
});
