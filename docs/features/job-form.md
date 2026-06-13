# job-form

## Overview

求人（Job）を新規登録または編集するフォーム機能。基本情報・条件・スキル・メモ・ステータス日程の5セクションで構成され、保存後に JobDetail（求人詳細）へ遷移する。JobImport による自動入力との接続点も担う。

## Background

転職活動中に複数の求人を比較するには、同一フォーマットで求人情報を蓄積する必要がある。フォームを1画面に集約することで入力の網羅性を確保しつつ、セクション分割でスクロールしても文脈を失わない設計にした。

新規登録と編集を同一コンポーネント（`JobForm`）で担うのは、フォームロジックを一か所に保つためである。URL パラメータ `:id` の有無で動作を切り替えるため、ルーティング定義は `/jobs/new`（新規）と `/jobs/:id/edit`（編集）の2エントリになっている。

JobImport（LLM 出力 JSON）による自動入力は、フォームを直接操作せずに各フィールドを埋める手段として用意されている。詳細は [docs/features/job-import.md](./job-import.md) を参照。

## User Stories

1. 求人サイトで気になった求人の情報を手入力で登録したい
2. 既存の求人情報を後から編集・修正したい
3. 求人票 JSON（JobImport）を貼り付けるだけでフォームを自動入力し、確認後に保存したい
4. 企業名と職種を入力せずに保存しようとしたとき、何が不足しているか分かるエラーを見たい
5. 保存後はすぐに登録した求人の詳細画面に遷移してほしい

## Behavior

### モード切り替え（新規 / 編集）

| 条件 | 動作 |
|---|---|
| URL に `:id` パラメータなし（`/jobs/new`） | 新規登録モード。フォームは `EMPTY_JOB` で初期化される |
| URL に `:id` パラメータあり（`/jobs/:id/edit`） | 編集モード。`useJobStore` から該当 Job を取得してフォームに展開する |
| `:id` が存在しない Job を指す場合 | フォームは `EMPTY_JOB` のまま（ストアに Job が見つからない） |

### フォームセクション

#### 基本情報

| フィールド | 型 | 必須 | デフォルト | 補足 |
|---|---|---|---|---|
| 企業名（`companyName`） | string | 必須 | `''` | 空白のみも無効 |
| 職種・ポジション名（`position`） | string | 必須 | `''` | 空白のみも無効 |
| 媒体（`source`） | JobSource | 任意 | `'Wantedly'` | JOB_SOURCES 列挙値から選択 |
| 媒体名・自由入力（`sourceNote`） | string | 任意 | `''` | `source === 'その他'` のときのみ表示 |
| 求人URL（`url`） | string (url) | 任意 | `''` | |

#### 条件

| フィールド | 型 | 必須 | デフォルト | 補足 |
|---|---|---|---|---|
| 年収下限（`salaryMin`） | number \| null | 任意 | `null` | 万円単位。空欄で `null` |
| 年収上限（`salaryMax`） | number \| null | 任意 | `null` | 万円単位。空欄で `null` |
| 勤務地（`location`） | string | 任意 | `''` | |
| リモート可否（`remoteType`） | RemoteType | 任意 | `'フルリモート'` | `'不可' / '一部リモート' / 'フルリモート'` |
| 雇用形態（`employmentType`） | EmploymentType | 任意 | `'正社員'` | `'正社員' / '契約社員' / '業務委託' / 'その他'` |
| 始業時間（`workStartTime`） | string | 任意 | `''` | 例：`9:00` / `フレックス` |
| 年末年始休暇（`yearEndHolidays`） | number \| null | 任意 | `null` | 日数。空欄で `null` |
| 年間賞与回数（`annualBonus`） | number \| null | 任意 | `null` | 空欄で `null` |
| 住宅補助（`housingAllowance`） | boolean | 任意 | `false` | チェックボックス |

#### スキル・技術

| フィールド | 型 | 補足 |
|---|---|---|
| 必須スキル（`requiredSkills`） | string[] | タグ入力。Enter で追加 |
| 歓迎スキル（`preferredSkills`） | string[] | タグ入力。Enter で追加 |
| 技術スタック（`techStack`） | string[] | タグ入力。Enter で追加 |

#### メモ

| フィールド | 型 | 補足 |
|---|---|---|
| 業務内容・要約（`summary`） | string | 自由記述。4行テキストエリア |
| 気になる点・懸念（`notes`） | string | 自由記述。3行テキストエリア |

#### ステータス・日程

| フィールド | 型 | 必須 | デフォルト | 補足 |
|---|---|---|---|---|
| 応募ステータス（`status`） | ApplicationStatus | 任意 | `'未応募'` | APPLICATION_STATUSES 列挙値から選択 |
| 応募日（`appliedAt`） | string \| null | 任意 | `null` | 日付ピッカー。空欄で `null` |
| 次アクション日（`nextActionAt`） | string \| null | 任意 | `null` | 日付ピッカー。空欄で `null` |

### バリデーションルール

- `companyName` が空文字（トリム後）の場合：`'企業名は必須です'` を表示
- `position` が空文字（トリム後）の場合：`'職種は必須です'` を表示
- バリデーションエラーがある場合、保存処理は実行されない

### 保存処理

- 新規登録：`addJob()` を呼び出し、`id`・`createdAt`・`updatedAt` を付与して `useJobStore` に追加する
- 編集：`updateJob(id, form)` を呼び出してストアを更新する
- 保存成功後は `/`（求人一覧）へ遷移する

### JobImport による自動入力

ヘッダー右側の「JSON から入力」ボタンで `JobImportModal` を開く。JSON を貼り付けると `parseJobImport()` → `normalizeJobImport()` を経た値がフォームの現在の状態にマージされる（`setForm((f) => ({ ...f, ...data }))`）。すでに手入力した値は上書きされる。詳細は [docs/features/job-import.md](./job-import.md) を参照。

## Related Issues

- #31
