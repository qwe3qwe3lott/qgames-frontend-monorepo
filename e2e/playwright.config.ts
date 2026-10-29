import {defineConfig, devices} from '@playwright/test';

/**
 * E2E против поднятых стендов: бэкенд (`docker compose up` в его репозитории)
 * и фронт (`docker compose up` здесь или `pnpm dev`). Адреса — из env.
 */
const PORTAL_URL = process.env['E2E_PORTAL_URL'] ?? 'http://localhost:3000';
const ADMIN_URL = process.env['E2E_ADMIN_URL'] ?? 'http://localhost:3001';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  // Игроков на стенде 10, на воркер — 3 (src/portal/players.ts).
  workers: 3,
  forbidOnly: process.env['CI'] !== undefined,
  reporter: [['list'], ['html', {open: 'never'}]],
  use: {
    ...devices['Desktop Chrome'],
    // Клик по недоступному элементу (например, доска не своего хода) падает, а не ждёт до конца теста.
    actionTimeout: 15_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {name: 'portal', testDir: './tests/portal', use: {baseURL: PORTAL_URL}},
    {name: 'admin', testDir: './tests/admin', use: {baseURL: ADMIN_URL}},
  ],
});
