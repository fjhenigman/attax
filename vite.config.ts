/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
  // Use /attax/ for GitHub Pages deployment
  // The repository name should match the GitHub repository
  base: process.env.CI ? '/attax/' : '/',
});
