import { test, expect } from '@playwright/test';
import { injectFakeSession } from './helpers/fakeSession';

test.describe('オフライン警告バナー', () => {
  test('Supabase への接続が失敗すると警告バナーが表示される', async ({ page }) => {
    await injectFakeSession(page);
    // Supabase の REST API への全リクエストを遮断して pull 失敗を再現する
    await page.route('**/rest/v1/**', (route) => route.abort());
    await page.goto('/');
    await expect(page.getByText(/前回のデータを表示しています/)).toBeVisible({ timeout: 10000 });
  });

  test('バナーを閉じるボタンで非表示になる', async ({ page }) => {
    await injectFakeSession(page);
    await page.route('**/rest/v1/**', (route) => route.abort());
    await page.goto('/');
    await expect(page.getByText(/前回のデータを表示しています/)).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: '閉じる' }).click();
    await expect(page.getByText(/前回のデータを表示しています/)).not.toBeVisible();
  });
});
