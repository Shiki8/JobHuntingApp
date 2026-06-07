# ADR 0004: クロスデバイス同期の基盤として Supabase + Google OAuth を採用する

## Status
Accepted

## Context
アプリのデータはすべて localStorage に保存されており、登録した求人・評価・スコアを別端末（スマホなど）から閲覧する手段がなかった。
PC での登録内容をスマホブラウザで確認できるようにするため、クロスデバイス同期の仕組みを導入する必要が生じた。

選択肢として以下を検討した：

1. **Supabase**（BaaS）— PostgreSQL + 認証 + RLS が無料枠で揃う。セルフホスト不要
2. **Firebase / Firestore** — リアルタイム同期が強力だが、今回はリアルタイムを必要としない
3. **自前サーバー（Node.js + DB）** — 完全なコントロールが得られるが運用コストが生じる
4. **クラウドストレージ経由（Google Drive など）** — サーバー不要だが OAuth フローが煩雑

## Decision

**Supabase を主データストア、localStorage をキャッシュとして採用する。** 認証は Google OAuth とし、未ログイン状態ではアプリを使用不可（ログイン壁）とする。

具体的な方針：
- テーブルスキーマは `id TEXT`, `user_id`, `updated_at` をカラムとし、残りのドメインデータは `data JSONB` に格納するハイブリッド方式
- 同期処理は `src/lib/sync.ts` に分離し、既存の Zustand ストアへの変更を最小限に抑える
- データ取得は起動時の1回のみ（リアルタイム購読なし）
- 初回ログイン時に localStorage の既存データを Supabase へ自動マイグレーションするダイアログを表示する
- 書き込み（add/update/delete）のたびに即時 `pushUpsert` / `pushDelete` を呼び、双方向同期を実現する
- 競合解決は last-write-wins（後から書き込んだ側が勝つ）とし、明示的な競合検出は行わない。個人利用かつ同時編集が現実的に発生しないため許容する

## Rationale

**Supabase を選んだ理由**: Firebase はリアルタイム同期が強みだが、このアプリは「開く前に更新されていればよい」起動時フェッチで十分であり、Firestore の強みを活かせない。Supabase は PostgreSQL ベースで RLS による行レベルのアクセス制御が書きやすく、将来スキーマを拡張しやすい。

**JSONB ハイブリッドを選んだ理由**: `Job` 型は配列フィールドを含む複雑な構造を持つ。全カラム正規化は DDL が肥大化し、型変更のたびに ALTER TABLE が必要になる。`user_id` と `updated_at` のみカラムに出すことで RLS と競合解決に必要な情報を確保しつつ、スキーマの柔軟性を維持する。

**ログイン壁を選んだ理由**: ローカルモードと Supabase モードの2系統を維持すると、状態管理の複雑さが増しバグの温床になる。個人利用の転職管理アプリとして常にログイン済みで使うことが前提であり、ローカル専用モードを残す必要性が低い。

**同期レイヤーを分離した理由**: Zustand ストアは同期的な localStorage 操作を前提に設計されている。ストア内に非同期の Supabase 呼び出しを混在させると責務が拡散する。`sync.ts` に分離することで、ストアの変更を最小限にしつつ段階的に移行できる。

## Consequences

- アプリの利用に Google アカウントへのログインが必須になる
- Supabase プロジェクトの作成と環境変数（`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`）の設定が前提条件となる
- ADR 0002 で採用した「バックエンドなし」方針はこの ADR により更新される。JobImport の生成フロー自体は変更しない
- `nanoid` が生成する ID は UUID 形式ではなく 16 文字 hex 文字列のため、Supabase の `id` カラムは `UUID` 型ではなく `TEXT` 型とする
- フロントエンドは Vercel にホスティングし、GitHub push で自動デプロイする。Supabase の Redirect URLs に本番 URL を登録することが前提条件
