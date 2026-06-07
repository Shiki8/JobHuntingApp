# design-to-component

Figma フレームを受け取り、このプロジェクトのスタック（React 19 + TypeScript + Tailwind CSS v4）で
コンポーネントとして実装するスキル。

## 使い方

```
/design-to-component <FigmaフレームURL または ノードID>
```

## 手順

### 1. Figma からデザイン情報を取得

`/figma-use` スキルを必ず先に呼び出す（`use_figma` の事前必須）。

その後 `get_design_context` でレイアウト・スタイル・コンポーネント構造を取得し、
`get_screenshot` でビジュアルを確認する。

### 2. 既存リソースとのマッピング

実装前に以下を確認し、**新規作成より再利用を優先**する。

- `src/components/ui/` — Button, Badge, Input, Modal, Spinner, Tag, ScoreStars, EmptyState
- `src/components/ui/index.ts` — 再エクスポート済みか確認
- Tailwind CSS v4 のユーティリティクラス（`@tailwindcss/vite` 経由）

### 3. 実装

- ファイル配置: ページ固有なら `src/pages/`、汎用なら `src/components/`
- Props は TypeScript の型として定義する
- レスポンシブが必要な場合は `sm:` / `md:` プレフィックスを使用
- コメントは原則なし。WHY が非自明なときのみ1行

### 4. 確認

`npm run dev` でブラウザ表示を確認。Figma のスクリーンショットと並べて
レイアウト・色・間隔のズレがないか目視チェックする。

## 制約

- 既存の `src/components/ui/` にないプリミティブを作る場合は、`index.ts` への追加も行う
- Zustand ストアへの接続が必要なら CLAUDE.md のストア構成を参照する
- バックエンドなし・localStorage 永続化のアーキテクチャを前提とする
