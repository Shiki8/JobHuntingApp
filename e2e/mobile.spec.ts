import { test, expect } from '@playwright/test';
import { injectFakeSession } from './helpers/fakeSession';

const MOBILE = { width: 375, height: 812 };
const DESKTOP = { width: 1280, height: 800 };

test.beforeEach(async ({ page }) => {
  await injectFakeSession(page);
});

// ─── #11 Layout ───────────────────────────────────────────────
test.describe('Layout: モバイルナビゲーション', () => {
  test('モバイル幅でボトムタブバーが表示され、サイドバーが非表示になる', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');

    await expect(page.getByRole('navigation', { name: 'ボトムナビゲーション' })).toBeVisible();
    await expect(page.locator('aside')).not.toBeVisible();
  });

  test('ボトムタブバーに4つのタブが表示される', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'ボトムナビゲーション' });

    await expect(nav.getByRole('link', { name: '求人一覧' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '比較' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '評価軸' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '設定' })).toBeVisible();
  });

  test('評価軸タブをタップすると /criteria に遷移する', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'ボトムナビゲーション' });

    await nav.getByRole('link', { name: '評価軸' }).click();
    await expect(page).toHaveURL('/criteria');
  });

  test('モバイル幅で FAB（求人を追加）が求人一覧ページに表示される', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');

    await expect(page.locator('[aria-label="求人を追加"]')).toBeVisible();
  });

  test('FAB をタップすると /jobs/new に遷移する', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');

    await page.locator('[aria-label="求人を追加"]').click();
    await expect(page).toHaveURL('/jobs/new');
  });

  test('/jobs/new では FAB が表示されない', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/jobs/new');

    await expect(page.getByRole('button', { name: '求人を追加' })).not.toBeVisible();
  });

  test('デスクトップ幅でサイドバーが表示され、ボトムタブバーが非表示になる', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');

    await expect(page.locator('aside')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'ボトムナビゲーション' })).not.toBeVisible();
  });
});

// ─── #12 Compare ──────────────────────────────────────────────
test.describe('比較画面: モバイルレイアウト', () => {
  test('2件未満の選択で空状態が表示される', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/compare');

    await expect(page.getByText('比較する求人を選んでください')).toBeVisible();
  });

  test('モバイル幅で比較テーブルが表示される', async ({ page }) => {
    const jobs = [
      {
        id: 'j1', companyName: 'テスト株式会社A', position: 'エンジニア',
        source: 'Wantedly', sourceNote: '', url: '', salaryMin: 600, salaryMax: 900,
        location: '東京', remoteType: 'フルリモート', employmentType: '正社員',
        yearEndHolidays: null, workStartTime: '', housingAllowance: false,
        annualBonus: null, requiredSkills: [], preferredSkills: [], techStack: [],
        summary: '', notes: '', status: '未応募', appliedAt: null, nextActionAt: null,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
      {
        id: 'j2', companyName: 'テスト株式会社B', position: 'デザイナー',
        source: 'Green', sourceNote: '', url: '', salaryMin: 500, salaryMax: 700,
        location: '大阪', remoteType: '一部リモート', employmentType: '正社員',
        yearEndHolidays: null, workStartTime: '', housingAllowance: false,
        annualBonus: null, requiredSkills: [], preferredSkills: [], techStack: [],
        summary: '', notes: '', status: '未応募', appliedAt: null, nextActionAt: null,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
    ];
    await page.route('**/rest/v1/jobs*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(jobs.map((j) => ({ id: j.id, data: j }))),
      })
    );
    await page.setViewportSize(MOBILE);
    await page.goto('/');

    const checkboxes = page.getByRole('checkbox');
    await checkboxes.first().check();
    await checkboxes.nth(1).check();
    await page.getByRole('navigation', { name: 'ボトムナビゲーション' })
      .getByRole('link', { name: '比較' }).click();

    await expect(page.getByTestId('compare-table')).toBeVisible();
  });
});

// ─── #13 JobForm ──────────────────────────────────────────────
test.describe('求人フォーム: モバイルレイアウト', () => {
  test('モバイル幅で年収フィールドが2つとも表示される', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/jobs/new');

    await expect(page.getByPlaceholder('例：600')).toBeVisible();
    await expect(page.getByPlaceholder('例：900')).toBeVisible();
  });

  test('モバイル幅でバリデーションが正常に動作する', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/jobs/new');
    await page.waitForSelector('form');

    // 送信ボタンはフォーム末尾にあるため requestSubmit でフォームを送信
    await page.evaluate(() => {
      (document.querySelector('form') as HTMLFormElement)?.requestSubmit();
    });

    // エラーはフォーム先頭の企業名フィールドに表示される
    await expect(page.getByText('企業名は必須です')).toBeVisible();
  });
});
