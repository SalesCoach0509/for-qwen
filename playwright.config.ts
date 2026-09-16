import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * Tests the deployed application to verify it's genuinely live/dynamic
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run sequentially for better diagnostics
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  
  use: {
    // Base URL from environment variable
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Capture trace on failure
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Timeout for each action
    actionTimeout: 15000,
    
    // Timeout for navigation
    navigationTimeout: 30000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run your local dev server before starting the tests (only for local testing)
  // webServer: process.env.BASE_URL ? undefined : {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },

  // Global timeout
  timeout: 120000,
});
