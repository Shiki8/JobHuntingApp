import { test, expect } from '@playwright/test';
import { injectFakeSession } from './helpers/fakeSession';

const VALID_JSON = JSON.stringify({
  companyName: 'テスト株式会社',
  position: 'フロントエンドエンジニア',
  source: 'Green',
  url: 'https://green-japan.com/jobs/example',
  salaryMin: 600,
  salaryMax: 900,
  location: '東京・渋谷',
  remoteType: 'フルリモート',
  employmentType: '正社員',
  techStack: ['TypeScript', 'React'],
  summary: 'フロントエンド全般を担当します',
});

test.describe('JSON から入力モーダル', () => {
  test.beforeEach(async ({ page }) => {
    await injectFakeSession(page);
    await page.goto('/jobs/new');
    await page.waitForSelector('h1:has-text("求人を追加")');
  });

  test('フォームヘッダーに「JSON から入力」ボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'JSON から入力' })).toBeVisible();
  });

  test('ボタンを押すとモーダルが開きステップ1が表示される', async ({ page }) => {
    await page.getByRole('button', { name: 'JSON から入力' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('button', { name: 'プロンプトをコピー' })).toBeVisible();
    await expect(page.getByRole('button', { name: /次へ/ })).toBeVisible();
  });

  test('「次へ」でステップ2（JSON テキストエリア）に遷移する', async ({ page }) => {
    await page.getByRole('button', { name: 'JSON から入力' }).click();
    await page.getByRole('button', { name: /次へ/ }).click();
    await expect(page.getByPlaceholder(/companyName/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'フォームに反映' })).toBeVisible();
  });

  test('「戻る」でステップ1に戻る', async ({ page }) => {
    await page.getByRole('button', { name: 'JSON から入力' }).click();
    await page.getByRole('button', { name: /次へ/ }).click();
    await page.getByRole('button', { name: /戻る/ }).click();
    await expect(page.getByRole('button', { name: 'プロンプトをコピー' })).toBeVisible();
  });

  test('ESC キーでモーダルが閉じる', async ({ page }) => {
    await page.getByRole('button', { name: 'JSON から入力' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('壊れた JSON を貼り付けるとエラーメッセージが表示される', async ({ page }) => {
    await page.getByRole('button', { name: 'JSON から入力' }).click();
    await page.getByRole('button', { name: /次へ/ }).click();
    await page.getByPlaceholder(/companyName/).fill('{invalid json');
    await page.getByRole('button', { name: 'フォームに反映' }).click();
    await expect(page.getByText(/有効な JSON ではありません/)).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('有効な JSON を貼り付けるとフォームに反映されモーダルが閉じる', async ({ page }) => {
    await page.getByRole('button', { name: 'JSON から入力' }).click();
    await page.getByRole('button', { name: /次へ/ }).click();
    await page.getByPlaceholder(/companyName/).fill(VALID_JSON);
    await page.getByRole('button', { name: 'フォームに反映' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByPlaceholder('例：株式会社〇〇')).toHaveValue('テスト株式会社');
    await expect(page.getByPlaceholder('例：フロントエンドエンジニア')).toHaveValue('フロントエンドエンジニア');
    await expect(page.getByPlaceholder('例：600')).toHaveValue('600');
    await expect(page.getByPlaceholder('例：900')).toHaveValue('900');
  });

  test('source が enum 外の JSON を貼り付けると source=その他・sourceNote に元の値が入る', async ({ page }) => {
    const json = JSON.stringify({ companyName: 'Acme', source: 'Indeed' });
    await page.getByRole('button', { name: 'JSON から入力' }).click();
    await page.getByRole('button', { name: /次へ/ }).click();
    await page.getByPlaceholder(/companyName/).fill(json);
    await page.getByRole('button', { name: 'フォームに反映' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.locator('select').first()).toHaveValue('その他');
    await expect(page.getByPlaceholder('例：ビズリーチ')).toHaveValue('Indeed');
  });

  test('再度開いたとき前回の入力内容がリセットされている', async ({ page }) => {
    // 1回目：JSON を入力してエラーを出す
    await page.getByRole('button', { name: 'JSON から入力' }).click();
    await page.getByRole('button', { name: /次へ/ }).click();
    await page.getByPlaceholder(/companyName/).fill('{bad');
    await page.getByRole('button', { name: 'フォームに反映' }).click();
    await page.keyboard.press('Escape');

    // 2回目：ステップ1から始まり、テキストエリアが空
    await page.getByRole('button', { name: 'JSON から入力' }).click();
    await expect(page.getByRole('button', { name: 'プロンプトをコピー' })).toBeVisible();
    await page.getByRole('button', { name: /次へ/ }).click();
    await expect(page.getByPlaceholder(/companyName/)).toHaveValue('');
  });
});
