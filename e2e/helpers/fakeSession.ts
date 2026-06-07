import type { Page } from '@playwright/test';
import { loadEnv } from 'vite';

// Supabase の storage key は `sb-{projectRef}-auth-token` の形式
const env = loadEnv('development', process.cwd(), '');
const projectRef = (env.VITE_SUPABASE_URL ?? '').match(/https?:\/\/([^.]+)/)?.[1] ?? '';
export const AUTH_STORAGE_KEY = `sb-${projectRef}-auth-token`;

export async function injectFakeSession(page: Page) {
  await page.addInitScript((storageKey) => {
    const fakeSession = {
      access_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
        '.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjo5OTk5OTk5OTk5fQ' +
        '.fake-signature',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: 9999999999,
      refresh_token: 'fake-refresh-token',
      user: {
        id: 'test-user-id',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'test@example.com',
        email_confirmed_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
    localStorage.setItem(storageKey, JSON.stringify(fakeSession));
  }, AUTH_STORAGE_KEY);

  // Supabase REST API を空の成功レスポンスで返し、pullAll のエラーバナーが出ないようにする
  await page.route('**/rest/v1/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  );
}
