# job-import-flow

## Overview

ユーザーが求人サイトの内容を外部 LLM で構造化 JSON（JobImport）に変換し、アプリに貼り付けることで求人（Job）を登録するフロー。

## Actors

- **ユーザー**: 求人サイトを閲覧し、LLM を操作して JSON を生成・貼り付ける

## Flow

1. ユーザーが求人サイト（Wantedly / Green / doda など）で求人票を開く
2. 求人票のテキストを外部 LLM（Claude.ai・ChatGPT 等）に貼り付け、JobImport JSON への変換を依頼する
3. LLM が出力した JSON をコピーする
4. アプリの「+ 求人を追加」ボタン（`/jobs/new`）に遷移する
5. 求人登録フォーム上部の「求人票 JSON を貼り付け」エリアに JSON を貼り付ける
6. `parseJobImport()` がバリデーションを実行する（必須フィールド不足・JSON 構文エラーはエラー表示）
7. `normalizeJobImport()` が enum 外の値をフォームデフォルトに正規化する
8. 正規化された値が JobForm の各フィールドに展開される
9. ユーザーがフォームの内容を確認・修正して保存する
10. Job が `useJobStore` に登録され、求人一覧（`/`）に遷移する

## Edge Cases

- **JSON 構文エラー**: `parseJobImport()` がエラーを返し、フォームに展開されない。エラーメッセージを表示する
- **必須フィールド欠落**: `parseJobImport()` がバリデーションエラーを返す
- **JobSource が固定リスト外の値**: `normalizeJobImport()` が `'その他'` に正規化し、元の値を `sourceNote` に格納する
- **remoteType が想定外の値**: `'不可'` にフォールバックする
- **employmentType が想定外の値**: `'正社員'` にフォールバックする
- **アプリが付与するフィールド（applicationStatus・createdAt など）が含まれる場合**: JobImport の型には存在しないため無視される

## Related Features

- [docs/features/job-import.md](../features/job-import.md) — parseJobImport / normalizeJobImport の詳細仕様

## Related Issues

- #26 PRD: Docs-as-Code ドキュメントインフラの整備（このサンプルドキュメント自体の文脈）
- ADR-0002: 求人票データの生成は外部 LLM に委譲しバックエンドを持たない
