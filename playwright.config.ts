import { defineConfig, devices } from '@playwright/test';

// Determine base path to match vite.config.ts logic
const getBasePath = () => {
  if (process.env.VITE_BASE_PATH) {
    return process.env.VITE_BASE_PATH;
  }
  return process.env.CI ? '/attax/' : '/';
};

const basePath = getBasePath();
const baseURL = `http://localhost:4173${basePath === '/' ? '' : basePath}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
