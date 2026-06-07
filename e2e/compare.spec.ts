import { test, expect } from '@playwright/test';
import { injectFakeSession } from './helpers/fakeSession';

const JOBS = [
  {
    id: 'j1',
    companyName: 'テスト株式会社A',
    position: 'フロントエンドエンジニア',
    source: 'Wantedly',
    sourceNote: '',
    url: '',
    salaryMin: 600,
    salaryMax: 900,
    location: '東京',
    remoteType: 'フルリモート',
    employmentType: '正社員',
    yearEndHolidays: 10,
    workStartTime: '10:00',
    housingAllowance: true,
    annualBonus: 200,
    requiredSkills: ['TypeScript', 'React', 'Node.js', 'GraphQL'],
    preferredSkills: [],
    techStack: ['Next.js', 'PostgreSQL', 'Docker', 'AWS'],
    summary: '',
    notes: '',
    status: '面接中',
    appliedAt: null,
    nextActionAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'j2',
    companyName: 'サンプル合同会社B',
    position: 'バックエンドエンジニア',
    source: 'その他',
    sourceNote: 'リファラル',
    url: '',
    salaryMin: null,
    salaryMax: 700,
    location: '',
    remoteType: '一部リモート',
    employmentType: '契約社員',
    yearEndHolidays: null,
    workStartTime: 'フレックス',
    housingAllowance: false,
    annualBonus: null,
    requiredSkills: ['Go', 'Python'],
    preferredSkills: [],
    techStack: ['Kubernetes'],
    summary: '',
    notes: '',
    status: '応募済',
    appliedAt: null,
    nextActionAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function setupTwoJobs(page: Parameters<typeof injectFakeSession>[0]) {
  await injectFakeSession(page);
  await page.route('**/rest/v1/jobs*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(JOBS.map((j) => ({ id: j.id, data: j }))),
    })
  );
}

async function goToCompareWithTwoJobs(page: Parameters<typeof injectFakeSession>[0]) {
  await setupTwoJobs(page);
  await page.goto('/');
  const checkboxes = page.getByRole('checkbox');
  await checkboxes.first().check();
  await checkboxes.nth(1).check();
  await page.getByRole('link', { name: '比較' }).first().click();
  await page.waitForURL('/compare');
}

// ─── Slice 1: テーブル骨格 ────────────────────────────────────────────

test.describe('Compare: テーブル骨格', () => {
  test('2件未満の選択では空状態が表示される', async ({ page }) => {
    await injectFakeSession(page);
    await page.goto('/compare');

    await expect(page.getByText('比較する求人を選んでください')).toBeVisible();
  });

  test('2件選択するとテーブルが表示される', async ({ page }) => {
    await goToCompareWithTwoJobs(page);

    await expect(page.getByTestId('compare-table')).toBeVisible();
  });

  test('左固定列に2社の会社名が表示される', async ({ page }) => {
    await goToCompareWithTwoJobs(page);

    const table = page.getByTestId('compare-table');
    await expect(table.getByText('テスト株式会社A')).toBeVisible();
    await expect(table.getByText('サンプル合同会社B')).toBeVisible();
  });

  test('ヘッダに11列の項目名が正しい順番で表示される', async ({ page }) => {
    await goToCompareWithTwoJobs(page);

    // nth(0) は左固定の「求人」列なのでスキップし、1〜11 を検証する
    // 応募ステータスはスティッキー列のバッジで表示するため列から除外
    const headers = page.getByTestId('compare-table').locator('thead th');
    const expected = [
      '勤務地', '年収', '始業時間', 'リモート可否',
      '年間賞与', '年末年始休暇', '住宅補助', '雇用形態',
      '必須スキル', '技術スタック', '媒体',
    ];
    for (let i = 0; i < expected.length; i++) {
      await expect(headers.nth(i + 1)).toContainText(expected[i]);
    }
    // 応募ステータスはスティッキー列のバッジで表示するため列ヘッダには出ない
    // （'媒体'が11番目に来ることで間接的に保証済み）
  });
});

// ─── Slice 2: 全基本情報セル ──────────────────────────────────────────

test.describe('Compare: 基本情報セル', () => {
  test('年収が「X〜Y万」形式で表示される', async ({ page }) => {
    await goToCompareWithTwoJobs(page);

    await expect(page.getByTestId('compare-table')).toContainText('600〜900万');
  });

  test('年収の上限のみの場合「〜Y万」と表示される', async ({ page }) => {
    await goToCompareWithTwoJobs(page);

    await expect(page.getByTestId('compare-table')).toContainText('〜700万');
  });

  test('住宅補助が true のとき「✓」と表示される', async ({ page }) => {
    await goToCompareWithTwoJobs(page);

    const rows = page.getByTestId('compare-table').locator('tbody tr');
    const row1 = rows.first();
    await expect(row1).toContainText('✓');
  });

  test('住宅補助が false のとき「—」と表示される（他の—と区別できない場合はスキップ）', async ({ page }) => {
    await goToCompareWithTwoJobs(page);

    const rows = page.getByTestId('compare-table').locator('tbody tr');
    const row2 = rows.nth(1);
    // 勤務地が空欄・年末年始休暇・年間賞与・住宅補助すべて — のはず
    const cells = row2.locator('td');
    // 住宅補助列は 7番目（インデックス7、左固定列=0を含むと8番目）
    // left-col(0), 勤務地(1), 年収(2), 始業時間(3), リモート(4), 賞与(5), 年末年始(6), 住宅補助(7)
    await expect(cells.nth(7)).toContainText('—');
  });

  test('必須スキルが4件以上のとき先頭3件＋「+N」で表示される', async ({ page }) => {
    await goToCompareWithTwoJobs(page);

    const table = page.getByTestId('compare-table');
    await expect(table).toContainText('TypeScript');
    await expect(table).toContainText('React');
    await expect(table).toContainText('Node.js');
    await expect(table).toContainText('+1');
  });

  test('技術スタックが4件以上のとき先頭3件＋「+N」で表示される', async ({ page }) => {
    await goToCompareWithTwoJobs(page);

    const table = page.getByTestId('compare-table');
    await expect(table).toContainText('Next.js');
    await expect(table).toContainText('PostgreSQL');
    await expect(table).toContainText('Docker');
    await expect(table).toContainText('+1');
  });

  test('媒体が「その他」のとき sourceNote も表示される', async ({ page }) => {
    await goToCompareWithTwoJobs(page);

    await expect(page.getByTestId('compare-table')).toContainText('リファラル');
  });

  test('値が未設定のセルは「—」と表示される', async ({ page }) => {
    await goToCompareWithTwoJobs(page);

    const rows = page.getByTestId('compare-table').locator('tbody tr');
    const row2 = rows.nth(1);
    // 勤務地が空 → —
    await expect(row2.locator('td').nth(1)).toContainText('—');
  });

  test('notes が入力されていれば「気になる点」列に表示される', async ({ page }) => {
    await injectFakeSession(page);
    const jobsWithNotes = [
      { ...JOBS[0], notes: 'オンコールが心配' },
      { ...JOBS[1], notes: '' },
    ];
    await page.route('**/rest/v1/jobs*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(jobsWithNotes.map((j) => ({ id: j.id, data: j }))),
      })
    );
    await page.goto('/');
    const checkboxes = page.getByRole('checkbox');
    await checkboxes.first().check();
    await checkboxes.nth(1).check();
    await page.getByRole('link', { name: '比較' }).first().click();
    await page.waitForURL('/compare');

    const table = page.getByTestId('compare-table');
    await expect(table).toContainText('気になる点');
    await expect(table).toContainText('オンコールが心配');
  });

  test('notes が未入力のとき「気になる点」列は「—」と表示される', async ({ page }) => {
    await injectFakeSession(page);
    const jobsNoNotes = [
      { ...JOBS[0], notes: '' },
      { ...JOBS[1], notes: '' },
    ];
    await page.route('**/rest/v1/jobs*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(jobsNoNotes.map((j) => ({ id: j.id, data: j }))),
      })
    );
    await page.goto('/');
    const checkboxes = page.getByRole('checkbox');
    await checkboxes.first().check();
    await checkboxes.nth(1).check();
    await page.getByRole('link', { name: '比較' }).first().click();
    await page.waitForURL('/compare');

    const rows = page.getByTestId('compare-table').locator('tbody tr');
    // 気になる点列は最後（td index = 13）
    await expect(rows.first().locator('td').last()).toContainText('—');
  });
});
