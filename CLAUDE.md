# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # 開発サーバー起動 (localhost:5173)
npm run dev -- --host  # LAN 経由でスマホからもアクセス可能な形で起動
npm run build        # TypeScript チェック + Vite ビルド
npm run lint         # ESLint
npm run test         # Vitest ユニットテスト（一回実行）
npm run test:watch   # Vitest ウォッチモード
npm run test:e2e     # Playwright E2E テスト（dev サーバーを自動起動）
```

単一テストファイルの実行:
```bash
npx vitest run src/lib/jobImport.test.ts
```

## 開発ワークフロー

変更の種別を判断してからフローを選ぶ。

### 種別の判断フロー

```
意図した仕様（ユーザーが期待する振る舞い）が変わるか？
  No → コードと仕様が食い違っているか？
         Yes → バグ修正
         No  → docsだけ間違っているか？
                 Yes → docs修正
                 No  → 仕様に影響しない変更（リファクタリング等）
  Yes → 実装前に「何を作るか」の選択肢が複数あるか？
         No  → 機能拡張
         Yes → 新機能 / 設計変更
```

### 仕様に影響しない変更
リファクタリング・パフォーマンス改善・テスト追加・依存更新・外観調整など。
1. 実装
2. PR 作成

### バグ修正
仕様と実装の乖離を直す。`docs/features/` の Behavior と実装が食い違っている状態。
1. GitHub Issue を起票
2. 実装
3. PR 作成

### docs修正
仕様は正しいが `docs/features/` や `docs/flows/` の記述が間違っている。
1. `docs:` コミットで該当ファイルを修正
2. PR 作成

### 機能拡張
仕様を追加・変更するが「何を作るか」は自明な変更。
1. 該当する `docs/features/` または `docs/flows/` を更新
2. 実装
3. PR 作成

### 新機能 / 設計変更
設計から始める必要がある変更。ユーザーフローに影響する場合や選択肢が複数ある場合。
1. `/grill-with-docs` でグリルしながら `docs/flows/` を更新（ユーザー視点）
2. `docs/features/` に実装詳細・Background を追記
3. 実装
4. PR 作成

### スキル使用の判断基準

スキルはオーバーヘッドを持つため、スコープに対して適切なものだけ使う。

#### 設計・要件フェーズ

| スキル | 使う条件 | スキップ条件 |
|---|---|---|
| `/grill-me` | 問題の設計空間を探索したい・どのワークフロー種別か判断がつかない | 要件が自明・すでに種別が確定している |
| `/grill-with-docs` | 新機能/設計変更で選択肢を絞りながら docs を更新したい（種別確定後） | `/grill-me` で済む探索・実装が自明な機能拡張 |
| `/to-prd` | 複数ステークホルダーで要件合意が必要・未確定の設計判断が多い | 1人・1セッションで完結・grill 後に仕様が確定している |
| `/to-issues` | 並行作業できる・複数セッションにまたがる・他者にアサイン可能 | 1〜3ファイル・1セッションで完結する変更 |

#### 実装・品質フェーズ

| スキル | 使う条件 | スキップ条件 |
|---|---|---|
| `/tdd` | 複雑なビジネスロジック・純粋関数のエッジケースをテストで記述できる | UI/CSS の変更・正しさがブラウザ目視でしか確認できない |
| `/diagnose` | 再現手順が不明・根本原因が特定できないバグ | 原因が明らかな typo・単純な値間違い |
| `/code-review` | 複数ファイルにまたがる変更・ロジックが複雑な PR 前 | 1〜2行の自明な修正 |
| `/qa` | リリース前に網羅的にエッジケースを確認したい | 実装とテストが自明な小変更 |
| `/design-to-component` | Figma フレームURLがある・デザイン仕様に忠実な実装が必要 | Figma デザインがない・簡単な UI を説明から直接実装できる |

### ブランチ戦略
- `main` から作業ブランチを切る
- 命名: `feat/<slug>` / `fix/<slug>` / `docs/<slug>` / `refactor/<slug>`
- PR は `main` に向けて作成し、ユーザーがレビュー後にマージ
- マージ戦略: **Squash merge**（作業中の細かいコミットを1つにまとめて main に追加）

### コミット規約
ドキュメント更新コミットには `docs:` プレフィックスを使用する。

```
docs: add job-import-flow.md
docs: update score-input.md with weight=0 behavior
feat: implement job import normalization
fix: correct weighted total denominator
refactor: extract weighted total calculation
```

## ドメイン用語

詳細は [`docs/context.md`](docs/context.md) を参照。主要概念の対応:

| 用語 | 型 | 説明 |
|---|---|---|
| 求人 (Job) | `Job` | 転職候補1件。応募ステータスを持つ |
| 評価軸 (Criteria) | `Criteria` | ユーザー定義の評価観点。重み (0–5) を持つ |
| 評価 (Score) | `Score` | Job × Criteria の組み合わせごとの採点 (1–5点) |
| 求人票データ (JobImport) | `JobImport` | LLM が出力した中間 JSON。Job 登録前の状態 |
| 合致度スコア | number | `round(Σ(score×weight) / Σ(weight×5) × 100)` |

## アーキテクチャ

### 技術スタック
- React 19 + TypeScript + Vite 8
- Tailwind CSS v4（`@tailwindcss/vite` プラグイン経由）
- React Router v7（`createBrowserRouter`）
- Zustand + `persist` ミドルウェア（**localStorage** をキャッシュとして利用）
- Supabase（認証 + クラウド同期。`@supabase/supabase-js`）
- dnd-kit（評価軸の並び替え）
- lucide-react（アイコン）
- Vitest（ユニットテスト）、Playwright（E2E）

### 認証フロー

`src/context/AuthContext.tsx` が Supabase Auth（Google OAuth）を管理する `AuthProvider` / `useAuth` を提供。

`src/main.tsx` の `AppShell` がエントリポイント:
- `session === null` → `<LoginPage />` を全画面表示
- `session` あり → `pullAll()` でクラウドからデータ取得 → `<RouterProvider>` でアプリ本体を表示
- ログイン直後に localStorage にデータがあれば `<MigrationDialog>` でクラウドへの移行を促す

### データ永続化 & 同期

データは **localStorage（Zustand persist）** と **Supabase** の二重管理。

```
書き込み: ストアの mutate → localStorage に即時反映 + Supabase に pushUpsert / pushDelete
読み込み: ログイン時に pullAll() → Supabase から取得してストアを上書き
```

`src/lib/sync.ts` — `pullAll()` / `pushUpsert()` / `pushDelete()` を提供。セッションがない場合は no-op。

`src/lib/migration.ts` — localStorage → Supabase への初回移行ロジック。`needsMigration()` で移行が必要か判定し、フラグ（`localStorage "migration-done-v1"`）で再表示を防ぐ。

### ストア構成

```
useJobStore      → localStorage "job-store"      求人リスト・フィルター
useCriteriaStore → localStorage "criteria-store"  評価軸リスト（初回起動時にデフォルト6軸を生成）
useScoreStore    → localStorage "score-store"     評価レコード (Job×Criteria)
useCompareStore  → 非永続化                       比較選択中の求人ID（最大5件）
```

各ストアの書き込み操作は Supabase への同期（`pushUpsert` / `pushDelete`）を fire-and-forget で呼ぶ。

**連鎖削除のルール**: ストア間の直接依存を避けるため、Job 削除時に `deleteScoresByJob`、Criteria 削除時に `deleteScoresByCriteria` を呼ぶのは UI（ページ・コンポーネント）側の責務。

### ルーティング

`src/routes.tsx` で定義。`Layout` がシェル（サイドバー）を担い、`<Outlet>` で各ページを差し込む。未ログイン時は `AppShell` がルーター手前で `<LoginPage>` を差し込むため、`/login` ルートは存在しない。

```
/                → JobList（求人一覧・フィルター）
/jobs/new        → JobForm（新規追加）
/jobs/:id        → JobDetail（詳細・ステータス変更）
/jobs/:id/edit   → JobForm（編集）
/jobs/:id/score  → ScoreInput（評価軸ごとの採点）
/criteria        → CriteriaSettings（評価軸管理・並び替え）
/compare         → Compare（マトリクス比較表）
/settings        → Settings
```

### JobImport フロー

求人サイトの内容を LLM に変換させた JSON → アプリへ貼り付け → JobForm に初期値として流し込む。

```
貼り付け JSON
  → parseJobImport()   (バリデーション)
  → normalizeJobImport()  (enum 外の値をフォームデフォルトに正規化)
  → JobForm の初期値として展開
```

`normalizeJobImport` は `source` が既知の `JobSource` 列挙値外の場合 `'その他'` + `sourceNote` に元の値を入れる。`remoteType` / `employmentType` が不正な場合はそれぞれ `'不可'` / `'正社員'` にフォールバック。

### UI コンポーネント

`src/components/ui/` に汎用プリミティブ（Button, Badge, Input, Modal, Spinner, Tag, ScoreStars, EmptyState）。`index.ts` から再エクスポートされている。

`src/components/` のアプリ固有コンポーネント:
- `CompareBar` — 比較選択バー（モバイルではボトムナビ上に表示）
- `JobCard` — 求人一覧カード
- `JobImportModal` — JSON 貼り付けモーダル
- `MigrationDialog` — localStorage → Supabase 初回移行ダイアログ
- `Layout` — サイドバー + `<Outlet>` を持つシェル

### nanoid

`src/lib/nanoid.ts` — `crypto.randomUUID()` を優先し、HTTP 環境（Android などで利用不可）では `crypto.getRandomValues()` にフォールバックする。
