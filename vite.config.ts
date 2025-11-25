/// <reference types="vitest" />
import { defineConfig } from 'vite';

// Determine base path:
// - VITE_BASE_PATH: Custom path for PR previews (e.g., /attax/PR/123/)
// - CI: Default GitHub Pages path (/attax/)
// - Otherwise: Local development (/)
const getBasePath = () => {
  if (process.env.VITE_BASE_PATH) {
    return process.env.VITE_BASE_PATH;
  }
  return process.env.CI ? '/attax/' : '/';
};

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
  base: getBasePath(),
  define: {
    // Polyfill global for browser compatibility (needed by simple-peer)
    global: 'globalThis',
  },
});
