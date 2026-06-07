import { defineConfig } from '@playwright/test';
import { loadEnv } from 'vite';

const env = loadEnv('development', process.cwd(), '');
process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL;

export default defineConfig({
  testDir: './e2e',
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
