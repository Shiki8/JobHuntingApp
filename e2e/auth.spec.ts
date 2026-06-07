import { test, expect } from '@playwright/test';
import { injectFakeSession } from './helpers/fakeSession';

test.describe('認証', () => {
  test('未認証でルートにアクセスするとログイン画面が表示される', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Google でログイン' })).toBeVisible();
  });

  test('ログアウト後にログイン画面に戻る', async ({ page }) => {
    await injectFakeSession(page);
    await page.goto('/');
    await expect(page.getByText('求人一覧').first()).toBeVisible();
    await page.getByRole('button', { name: 'ログアウト' }).click();
    await expect(page.getByRole('button', { name: 'Google でログイン' })).toBeVisible();
  });
});
