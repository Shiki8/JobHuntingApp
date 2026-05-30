# 転職比較アプリ 実装タスクリスト

> 要件定義書 (Notion) を元に作成。MVP完成を最優先とする。
> Phase 0（Figmaデザイン）→ Phase 1以降（実装）の順で進める。

---

## Phase 0 — Figma デザイン・プロトタイプ

### 0-1. Figmaファイル作成・基盤設定
- [x] 新規Figmaファイルを作成（ファイル名：`転職比較アプリ MVP`）
- [x] ページ構成を設定
  - `🎨 Components` — 再利用コンポーネントのみ置くページ
  - `📋 Flows` — 画面遷移・プロトタイプ用ページ
  - `🗂 Archive` — ボツ案の退避用
- [x] フレーム基準サイズを決定（Desktop: 1440×900、Content幅: 1200px）
- [x] Variables（ローカル変数）にデザイントークンを定義
  - Color 18種: `bg/*`(4), `text/*`(3), `brand/*`(2), `border/*`(2), `status/*`(7)
  - Number 14種: `spacing/2〜48`(10), `radius/sm〜full`(4)
- [ ] グリッドガイド設定（将来対応）

### 0-2. 共通コンポーネント作成（`🎨 Components` ページ）
> すべて Auto Layout で構築

- [x] **Button** — Primary / Secondary / Ghost
- [x] **Badge / StatusBadge** — ステータス7種（未応募/応募済/書類選考中/面接中/最終選考/内定/見送り）
- [ ] **Input** — Default/Focus/Error（将来対応）
- [x] **FilterChip** — Default/Selected
- [x] **ScoreBar** — 1〜5 ドット表現（filled/empty）
- [x] **Tag** — スキル・技術スタック表示用ピル
- [x] **JobCard** — Default/Selected/Hover の3バリアント
  - Auto Layout縦: 企業名＋バッジ行 / 職種＋媒体行 / 条件チップ行 / スコア＋チェックボックス行

### 0-3. ダッシュボード（求人一覧）画面 — Auto Layout設計
> `📋 Flows` ページに 1440×900 のフレームで作成（`求人一覧 / Dashboard`）

- [x] **サイドナビゲーション**（Auto Layout縦、幅240px固定）
  - ロゴ（転職比較）+ ナビ4項目（求人一覧アクティブ）+ 「+ 求人を追加」ボタン
- [x] **ページヘッダ**（Auto Layout横、space-between）
  - 左：「求人一覧」タイトル + 12件バッジ
  - 右：検索Input + フィルタボタン
- [x] **ステータスタブバー**（Auto Layout横）
  - すべて(12) / 未応募(4) / 応募済(3) / 面接中(3) / 内定(1) / 見送り(1)、アクティブ下線
- [x] **求人カードグリッド**（Auto Layout横、wrap、gap 16、3カラム）
  - サンプル6件（メルカリ/LayerX/Notion Japan/Sansan/freee/ZOZO）
- [x] **比較フローティングバー**（絶対配置、画面下部中央）
  - 選択中2件チップ + クリアリンク + 「2件を比較する」ボタン
- [ ] **空状態（0件）フレーム**（将来対応）

### 0-4. プロトタイプ接続
- [ ] 「+ 求人を追加」ボタン → 求人登録フォームフレーム（ダミーでよい）
- [ ] JobCard クリック → 求人詳細フレーム（ダミーでよい）
- [ ] ステータスタブ切り替えのインタラクション（同フレーム内でバリアント切り替え）
- [ ] 比較チェックボックスON → フローティングバー出現（Smart Animate）
- [ ] 「X件を比較する」ボタン → 比較画面フレーム（ダミーでよい）

### 0-5. デザインレビュー（実装前チェック）
- [ ] Auto Layout のネスト構造が正しいか（方向・gap・padding の意図が明確か）
- [ ] Variables がすべてのカラー・間隔に適用されているか（ハードコード値が残っていないか）
- [ ] コンポーネントのバリアントに命名の一貫性があるか（`property=value` 形式）
- [ ] 比較フローティングバーの出現アニメーションが意図通り動くか
- [ ] モバイル（375px）でカード1カラムに崩れる確認（閲覧中心想定）

---

> ### ~~🔥 `/grill-with-docs` を実行する — Phase 1 着手前~~（実施せずに通過）
> **本来の目的：** 型定義・ストア設計を書く前に、ドメインの核となる概念と関係性を固める。  
> **本来の論点：**
> - `Job` / `Criteria` / `Score` の関係性（Score は Job と Criteria の交点か、それとも独立した評価記録か）
> - `weightedTotal` の計算式（分母は全軸か入力済み軸か）
> - `Criteria.weight=0` の意味（無効化か重みなしか）
> - `Score.score` の範囲（1〜5 のみか、0を「明示的な非該当」として許すか）
>
> **教訓：** データモデルは後から変えると全レイヤーに波及するため、実装前に確定するのが最も安い。

---

## Phase 1 — データ層・状態管理

### 1-1. 型定義 (`src/types/index.ts`)
- [x] `ApplicationStatus` 型（7種 + `APPLICATION_STATUSES` 配列）
- [x] `RemoteType` / `EmploymentType` 型
- [x] `Job` 型（全フィールド）
- [x] `Criteria` 型（weight 0〜5, order付き）
- [x] `Score` 型（jobId/criteriaId/score 1〜5/memo/referenceUrl）
- [x] `DEFAULT_CRITERIA` プリセット6軸

### 1-2. ストア設計 (`src/store/`)
- [x] Zustand インストール
- [x] `useJobStore` — Job CRUD + 検索/フィルタ + `filteredJobs()` セレクタ
- [x] `useCriteriaStore` — Criteria CRUD + `reorder()` + `initDefaults()`
- [x] `useScoreStore` — Score upsert/delete + `weightedTotal()` 計算
- [x] `useCompareStore` — 比較選択 jobId[] (最大5件) + toggle/clear
- [x] `src/lib/nanoid.ts` — `crypto.randomUUID()` ベースの ID生成

### 1-3. ローカルストレージ永続化
- [x] `persist` middleware で jobStore / criteriaStore / scoreStore を永続化
- [x] `_version: 1` フィールドでマイグレーション準備

---

## Phase 2 — ルーティング・レイアウト

### 2-1. ルーター設定
- [x] `react-router-dom` インストール
- [x] `src/main.tsx` に `RouterProvider` を設定
- [x] ルート定義 (`src/routes.tsx`) — 全7ルート、`Layout` を親に nested routes

### 2-2. 共通レイアウト
- [x] `src/components/Layout.tsx` — 240px サイドバー + `<Outlet />`
- [x] ナビゲーション4項目（lucide-react アイコン付き）
- [x] `<NavLink>` でアクティブルートを青ハイライト
- [x] 「+ 求人を追加」ボタンをサイドバー下部に固定
- [x] 初回マウント時に `initDefaults()` でデフォルト評価軸を投入
- [x] `src/index.css` をTailwind用にリセット（`h-screen` が効くよう `height: 100%` をhtml/body/#rootに適用）

---

---

> ### 🔥 `/grill-with-docs` を実行する — Phase 3 着手前
> **目的：** UIを積み上げる前にドメインモデルと用語を固める。  
> **主な論点：**
> - 未入力の評価軸を `weightedTotal` でどう扱うか（0点 vs 分母から除外）
> - `Criteria.weight=0` の意味（無効化 vs 単なる重みなし）
> - `Job.source` は自由入力か固定リストか（フィルタ設計に直結）
> - `ApplicationStatus` は任意遷移を許すか（例：見送り→面接中への巻き戻し）

---

## Phase 3 — 共通UIコンポーネント (`src/components/ui/`)

- [x] `Badge` / `StatusBadge`（7ステータス色分け）/ `CountBadge`（タブ件数）
- [x] `Button` — primary / secondary / ghost / danger × loading 状態
- [x] `Input` / `Textarea` — ラベル・エラー・ヒント付き `FieldWrapper` で統一
- [x] `Select` — options 配列・placeholder 対応
- [x] `Modal` — ESC/backdrop 閉じ・スクロールロック、`ConfirmModal` 便利ラッパー
- [x] `ScoreDots` / `ScoreWithLabel` — 1〜5 ドット入力/表示（クリックでトグル）
- [x] `Tag` / `TagInput` — スキルタグ入力（Enter / カンマで追加）
- [x] `EmptyState` — アイコン・タイトル・説明・CTA
- [x] `Spinner` — sm/md/lg サイズ
- [x] `src/components/ui/index.ts` — 一括 export

---

## Phase 4 — 求人管理機能

### 4-1. 求人一覧 (`src/pages/JobList.tsx`)
- [x] `JobCard` コンポーネント（合致度スコア・未入力N軸・比較チェックボックス）
- [x] `CompareBar` フローティングバー（選択中チップ・クリア・比較ボタン）
- [x] ステータスタブ（全8種 + 件数バッジ）
- [x] 検索（企業名・職種・技術スタック）
- [x] フィルタ（媒体・リモート可否）
- [x] 空状態（0件 / フィルタ不一致）

### 4-2. 求人登録・編集フォーム (`src/pages/JobForm.tsx`)
- [x] 基本情報セクション（企業名・職種・媒体・sourceNote・URL）
- [x] 条件セクション（年収・勤務地・リモート・雇用形態・始業時間・休暇・賞与・住宅補助）
- [x] スキル・技術セクション（TagInput）
- [x] メモセクション（要約・気になる点）
- [x] ステータス・日程セクション
- [x] バリデーション（企業名・職種は必須）
- [x] 新規・編集共用（`id` パラメータで分岐）

### 4-3. 求人詳細 (`src/pages/JobDetail.tsx`)
- [x] 全フィールドの表示（テーブル形式）
- [x] 評価軸ごとのスコア・根拠メモ（未入力軸をオレンジで明示・weight=0は「スコア対象外」表示）
- [x] ステータス変更セレクタ（即時反映）
- [x] 削除時に Score を連鎖削除（ADR-0001・Q6 対応）
- [x] 編集 / 削除ボタン（削除は ConfirmModal）

---

## Phase 5 — 評価軸管理機能

### 5-1. 評価軸一覧・編集 (`src/pages/CriteriaSettings.tsx`)
- [x] 評価軸の一覧表示（名前・重み0〜5・説明）
- [x] ドラッグ&ドロップで並び替え（`@dnd-kit/core` + `@dnd-kit/sortable`）
- [x] インライン編集（名前・重み・説明をその場で編集）
- [x] 追加 / 削除（削除時に Score を連鎖削除・件数を確認ダイアログに表示）
- [x] `weight=0` の軸に「対象外」ラベル表示（Q4 対応）
- [x] フッタに「スコア対象N軸 / 対象外N軸 / 最大重み合計」を表示
- [x] デフォルト評価軸は `initDefaults()` で初回マウント時に自動投入済み（Layout.tsx）

---

## Phase 6 — 評価入力機能

### 6-1. 評価入力UI (`src/pages/ScoreInput.tsx`)
- [x] `/jobs/:id/score` に専用ページとして実装（JobDetailの「評価を入力する」から遷移）
- [x] スコア対象軸（weight>0）と参考記録軸（weight=0）をセクション分けして表示
- [x] 各軸：ScoreDots（クリックでトグル）+ 根拠メモ + 参照URL
- [x] 既存スコアをドラフトに読み込み（再編集時に現在値が反映される）
- [x] 進捗バー（スコア対象軸のN/M軸入力済み・%表示）
- [x] 全軸入力完了時に完了メッセージを表示
- [x] 「一括保存」ボタン（ヘッダ・フッタ両方配置）、保存後2秒間グリーンで完了表示

---

> ### 🔥 `/grill-with-docs` を実行する — Phase 7 着手前
> **目的：** 比較・スコアリングはアプリの核心。実装前に算出ロジックとUXを完全に確定する。  
> **主な論点：**
> - スコア方式の最終決定（単純合計 / 重み付き合計 / 必須条件の足切り）
> - 比較画面で「未評価の軸」をどう見せるか（空白 / グレーアウト / 0点表示）
> - 最大比較件数 5 は妥当か（横幅・可読性とのトレードオフ）
> - 「合致度スコア」の表示形式（%、点数、ランク）

---

## Phase 7 — 比較機能

### 7-1. 比較画面 (`src/pages/Compare.tsx`)
- [ ] 選択中の求人（最大5件）をカラムとして並べる
- [ ] 行 = 評価軸、列 = 求人の比較テーブル
- [ ] 各セルにスコア（星）と根拠メモを表示
- [ ] 合致度スコア（重み付き合計）を各カラムのヘッダに表示
- [ ] スコア最高列をハイライト
- [ ] 未入力セルを灰色で強調
- [ ] 基本情報（年収・リモート・勤務地）も比較テーブルの上部に固定表示
- [ ] 比較から求人を外すボタン

---

## Phase 8 — ステータス管理

- [ ] 求人一覧でステータス別タブ切り替え
- [ ] ステータス別件数の集計表示
- [ ] ステータス更新時の確認なし即時反映

---

## Phase 9 — 設定画面 (`src/pages/Settings.tsx`)

- [ ] 評価スコアの方式選択（単純合計 / 重み付き合計）
- [ ] ステータスラベルのカスタマイズ（将来対応）
- [ ] データのエクスポート（JSON ダウンロード）
- [ ] データのインポート（JSON アップロード）
- [ ] 全データリセット（確認ダイアログ付き）

---

## Phase 10 — 仕上げ・品質

- [ ] レスポンシブ対応（モバイルは閲覧中心）
- [ ] 空状態・エラー状態の UI 整備
- [ ] キーボードショートカット（検索フォーカス等）
- [ ] ページタイトル (`document.title`) の動的設定
- [ ] MVP 受け入れ条件の動作確認
  - 5件以上の求人登録、3軸以上で採点できる
  - 3件以上を比較画面で並べられる
  - ステータス更新 → 一覧フィルタが効く
  - 合致度スコアが計算され、根拠メモが追える

---

## 依存パッケージまとめ

| パッケージ | 用途 |
|---|---|
| `zustand` | 状態管理 |
| `react-router-dom` | ルーティング |
| `lucide-react` | アイコン |
| `@tailwindcss/vite` | スタイリング |
| `@dnd-kit/core` + `@dnd-kit/sortable` | 評価軸の並び替え |

---

## 実装順序（推奨）

```
Phase 0（Figma）→ Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 6 → Phase 5 → Phase 7 → Phase 8 → Phase 9 → Phase 10
```

**Phase 0 が実装の入口。** Figmaのコンポーネント構造（JobCard のAuto Layoutの列・行・gap）が
Phase 3 の React コンポーネント設計に直接対応する。デザインを固めてから実装に入ることで
「作りながら仕様が変わる」手戻りを防ぐ。

Phase 4（求人登録・一覧）と Phase 6（評価入力）を先に完成させることで、
Phase 7（比較）の動作確認に必要なデータが揃う。

### FigmaコンポーネントとReactコンポーネントの対応表

| Figmaコンポーネント | Reactコンポーネント | Phase |
|---|---|---|
| Button | `src/components/ui/Button.tsx` | 3 |
| StatusBadge | `src/components/ui/Badge.tsx` | 3 |
| Input / FilterChip | `src/components/ui/Input.tsx` | 3 |
| ScoreBar | `src/components/ui/ScoreStars.tsx` | 3 |
| Tag | `src/components/ui/Tag.tsx` | 3 |
| JobCard | `src/components/JobCard.tsx` | 4 |
| サイドナビゲーション | `src/components/Layout.tsx` | 2 |
| ステータスタブバー | `src/components/StatusTabs.tsx` | 8 |
| 比較フローティングバー | `src/components/CompareBar.tsx` | 7 |
