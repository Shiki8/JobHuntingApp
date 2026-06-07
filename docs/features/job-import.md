# job-import

## Overview

外部 LLM が出力した求人票 JSON（JobImport）をバリデーション・正規化し、JobForm の初期値として展開する機能。LLM の出力の揺れをアプリが吸収し、ユーザーが確認・修正できる状態にする。

## Background

求人サイトの内容をアプリが直接取得する方式はバックエンドと API コストが必要になる。外部 LLM に変換を委譲することでサーバーレスのまま機能を実現できる（詳細は ADR-0002）。

LLM の出力は enum 値（JobSource / RemoteType / EmploymentType）が仕様外の文字列になることがある。これをフォームに渡す前に正規化することで、バリデーションエラーなしに編集画面へ進める。

## User Stories

1. 求人サイトの内容を LLM で変換した JSON を貼り付けるだけで、手入力なしに求人登録フォームを埋めたい
2. LLM の出力に多少の揺れがあっても、アプリ側で吸収して編集可能な状態にしてほしい
3. 貼り付けた JSON に問題がある場合、何が間違っているか分かるエラーを見たい

## Behavior

### parseJobImport(json: string): JobImport | ParseError

- JSON 文字列をパースし、JobImport 型として検証する
- 必須フィールド（companyName, jobTitle など）が欠落している場合はエラーを返す
- JSON 構文エラーの場合はエラーを返す
- アプリが付与するフィールド（applicationStatus, createdAt など）は JobImport に存在しないため無視される

### normalizeJobImport(raw: JobImport): NormalizedJobImport

正規化ルール：

| フィールド | 条件 | 正規化後の値 |
|---|---|---|
| `source` | JobSource 列挙値外の文字列 | `'その他'` + 元の値を `sourceNote` に格納 |
| `remoteType` | RemoteType 列挙値外 | `'不可'` |
| `employmentType` | EmploymentType 列挙値外 | `'正社員'` |

### JobForm への展開

- `normalizeJobImport()` の戻り値を JobForm の初期値（`defaultValues`）として渡す
- ユーザーはフォームで全フィールドを確認・上書きできる
- 保存ボタンを押すまで Job は作成されない

## Related Issues

- #26 PRD: Docs-as-Code ドキュメントインフラの整備（このサンプルドキュメント自体の文脈）
- ADR-0002: 求人票データの生成は外部 LLM に委譲しバックエンドを持たない
