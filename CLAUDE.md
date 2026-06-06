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

## ドメイン用語

詳細は `CONTEXT.md` を参照。主要概念の対応:

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
- Zustand + `persist` ミドルウェア（全データを **localStorage** に保存。バックエンドなし）
- dnd-kit（評価軸の並び替え）
- Vitest（ユニットテスト）、Playwright（E2E）

### ストア構成

```
useJobStore      → localStorage "job-store"      求人リスト・フィルター
useCriteriaStore → localStorage "criteria-store"  評価軸リスト（初回起動時にデフォルト6軸を生成）
useScoreStore    → localStorage "score-store"     評価レコード (Job×Criteria)
useCompareStore  → 非永続化                       比較選択中の求人ID（最大5件）
```

**連鎖削除のルール**: ストア間の直接依存を避けるため、Job 削除時に `deleteScoresByJob`、Criteria 削除時に `deleteScoresByCriteria` を呼ぶのは UI（ページ・コンポーネント）側の責務。

### ルーティング

`src/routes.tsx` で定義。`Layout` がシェル（サイドバー）を担い、`<Outlet>` で各ページを差し込む。

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

### nanoid

`src/lib/nanoid.ts` — `crypto.randomUUID()` を優先し、HTTP 環境（Android などで利用不可）では `crypto.getRandomValues()` にフォールバックする。
