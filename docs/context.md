# 転職比較アプリ — コードベース入門ガイド

このドキュメントはプロジェクトのドメイン用語・アーキテクチャ概要・ストア構成をまとめた入門地図。
機能ごとの詳細仕様は `docs/features/`、ユーザーフローは `docs/flows/`、設計判断の記録は `docs/adr/` を参照。

---

## ドメイン用語

### 求人媒体 (JobSource)
求人を見つけた経路。Wantedly / Green / doda / LinkedIn / Findy / 企業サイト / エージェント / その他 の固定リスト。
自由入力ではなくドロップダウンで選択する。フィルタの正確性を担保するため固定値とする。
`'その他'` を選んだ場合は `sourceNote` フィールドに実際の媒体名を自由入力できる。フィルタ上は `'その他'` としてまとめて扱う。

### 求人 (Job)
転職先候補として登録した1件の求人情報。企業名・職種・条件・メモを持つ。
応募ステータスを持ち、ライフサイクルを通じて更新される。
`workStartTime` は始業時間（例：`"9:00"` `"フレックス"`）を指す。入社予定時期ではない。

### 評価軸 (Criteria)
求人を評価するときの観点。例：リモート、年収、技術スタック。
ユーザーが自由に作成・並び替えできる。各軸は **重み (weight)** を持つ。

### 重み (weight)
評価軸の重要度を表す 0〜5 の整数。
`weight=0` の軸は合致度スコアの計算に寄与しないが、評価（Score）のメモ・根拠は記録できる「参考記録モード」として機能する。
UIでは「スコア計算対象外」と明示する。

### 評価 (Score)
ある求人に対してある評価軸を 1〜5 点で採点した記録。
根拠メモ・参照リンクを付けられる。
求人と評価軸の組み合わせごとに最大1件存在する（upsert）。
点数は 1〜5 の整数のみ。「制度なし」「非該当」も低いスコアで表現し、詳細はメモ欄に記載する。
評価軸を削除すると、その軸に紐づく全 Score も連鎖削除される。
求人を削除すると、その求人に紐づく全 Score も連鎖削除される。
連鎖削除は UI 呼び出し側の責務（ストア間の直接依存を避けるため）。

### 合致度スコア (Weighted Total)
求人が自分の評価軸にどれだけマッチするかを 0〜100 で表した数値。
**未入力の評価軸は 0 点として全軸を分母に計算する。**
→ 入力が揃っていない求人のスコアは低く出る。UIで「未入力 N 軸あり」を併記して補う。
算出式: `round(Σ(score × weight) / Σ(weight × 5) × 100)`

### 応募ステータス (ApplicationStatus)
求人の選考フェーズ。未応募 / 応募済 / 書類選考中 / 面接中 / 最終選考 / 内定 / 見送り の7種。
任意の状態間を自由に遷移できる（巻き戻しも許可）。

### 求人票データ (JobImport)
外部 LLM が求人サイトの内容を変換して出力した構造化 JSON の中間表現。求人媒体・選考状況・日時など「アプリが付与するフィールド」を持たない点で 求人 (Job) と区別される。アプリへの登録が完了すると求人 (Job) になる。固定値フィールド（求人媒体・リモート可否・雇用形態）に想定外の値が含まれる場合はフォームのデフォルト値に正規化される。
_Avoid_: インポートデータ、LLM出力

### 比較画面 (Compare View)
複数の求人の基本情報を横断して比較するテーブル表示。評価軸スコアは表示しない。
2件未満で /compare にアクセスした場合は空状態を表示し、求人一覧へ誘導する（リダイレクトはしない）。

**デスクトップ・モバイル共通**: 行=求人・列=基本情報項目。左列（会社名・職種・応募ステータスバッジ）を固定し、項目列を横スクロールで確認する。

---

## 技術スタック

- React 19 + TypeScript + Vite 8
- Tailwind CSS v4（`@tailwindcss/vite` プラグイン経由）
- React Router v7（`createBrowserRouter`）
- Zustand + `persist` ミドルウェア（全データを **localStorage** に保存。バックエンドなし）
- dnd-kit（評価軸の並び替え）
- Vitest（ユニットテスト）、Playwright（E2E）

---

## ストア構成

```
useJobStore      → localStorage "job-store"      求人リスト・フィルター
useCriteriaStore → localStorage "criteria-store"  評価軸リスト（初回起動時にデフォルト6軸を生成）
useScoreStore    → localStorage "score-store"     評価レコード (Job×Criteria)
useCompareStore  → 非永続化                       比較選択中の求人ID（最大5件）
```

**連鎖削除のルール**: ストア間の直接依存を避けるため、Job 削除時に `deleteScoresByJob`、Criteria 削除時に `deleteScoresByCriteria` を呼ぶのは UI（ページ・コンポーネント）側の責務。

---

## ルーティング

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

---

## UI コンポーネント

`src/components/ui/` に汎用プリミティブ（Button, Badge, Input, Modal, Spinner, Tag, ScoreStars, EmptyState）。`index.ts` から再エクスポートされている。

---

## ユーティリティ

`src/lib/nanoid.ts` — `crypto.randomUUID()` を優先し、HTTP 環境（Android などで利用不可）では `crypto.getRandomValues()` にフォールバックする。
