# job-registration-flow

## Overview

ユーザーが求人情報を手入力または JobImport（LLM 出力 JSON）の貼り付けによって登録し、`useJobStore` に保存するまでのフロー。新規登録と編集の2パターンがある。

## Actors

- **ユーザー**: 求人情報を入力・確認・保存する操作者

## Flow

### パターン A：手入力による新規登録

1. ユーザーがサイドバーまたは求人一覧（`/`）の「+ 求人を追加」ボタンをクリックする
2. `/jobs/new` へ遷移し、`JobForm` が新規登録モードで表示される（全フィールドが空またはデフォルト値）
3. ユーザーが各セクション（基本情報・条件・スキル・技術・メモ・ステータス日程）を入力する
4. 「求人を登録」ボタンをクリックする
5. バリデーションが実行される（企業名・職種が必須）
6. バリデーション通過後、`addJob()` が呼ばれ Job が `useJobStore` に登録される
7. `/`（求人一覧）へ遷移する

### パターン B：JobImport（LLM 出力 JSON）による自動入力 → 確認・保存

1. ユーザーが `/jobs/new` に遷移する（手順はパターン A の手順 1–2 と同様）
2. ヘッダー右側の「JSON から入力」ボタンをクリックする
3. `JobImportModal` が開く
4. LLM が出力した JobImport JSON を貼り付ける
5. `parseJobImport()` がバリデーションを実行する
6. `normalizeJobImport()` が enum 外の値をフォームデフォルトに正規化する
7. 正規化された値が `JobForm` の各フィールドにマージされる（モーダルが閉じる）
8. ユーザーがフォームの内容を確認・修正する
9. 「求人を登録」ボタンをクリックして保存する（以降はパターン A の手順 5–7 と同様）

詳細は [docs/flows/job-import-flow.md](./job-import-flow.md) を参照。

### パターン C：既存求人の編集

1. ユーザーが JobDetail（`/jobs/:id`）の「編集」ボタンをクリックする
2. `/jobs/:id/edit` へ遷移し、`JobForm` が編集モードで表示される
3. `useJobStore` から該当 Job が読み込まれ、各フィールドに展開される
4. ユーザーが必要なフィールドを変更する
5. 「変更を保存」ボタンをクリックする
6. バリデーション通過後、`updateJob()` が呼ばれてストアが更新される
7. `/`（求人一覧）へ遷移する

## Edge Cases

- **企業名または職種が空のまま保存しようとした場合**: バリデーションエラーが表示され、保存処理は実行されない。エラーは該当フィールドのインラインに表示される
- **編集モードで `:id` に対応する Job が見つからない場合**: フォームは `EMPTY_JOB`（空のデフォルト値）のまま表示される
- **JobImport JSON に構文エラーがある場合**: `parseJobImport()` がエラーを返し、フォームへの展開は行われない。エラーメッセージがモーダル内に表示される
- **JobImport JSON に必須フィールドが欠落している場合**: `parseJobImport()` がバリデーションエラーを返し、モーダル内にエラーを表示する
- **JobImport 貼り付け後に手入力フィールドがある場合**: JSON の値が現在のフォーム状態にマージされるため、貼り付け前に手入力した値は上書きされる
- **キャンセルボタンまたは戻るボタンを押した場合**: `navigate(-1)` で直前の画面に戻る。Job は保存されない

## Related Features

- [docs/features/job-form.md](../features/job-form.md) — JobForm のフォーム仕様・バリデーションルール
- [docs/features/job-import.md](../features/job-import.md) — parseJobImport / normalizeJobImport の詳細仕様
- [docs/flows/job-import-flow.md](./job-import-flow.md) — JobImport フローの詳細（LLM による JSON 生成から JobForm 展開まで）

## Related Issues

- #31
