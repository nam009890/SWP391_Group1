import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  workers: 1,
  timeout: 60000,
  use: { baseURL: 'http://127.0.0.1:5187', headless: true, channel: 'chrome', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
});
