# Repository Custom Instructions

## Summary
- Next.js (App Router) + TypeScript のWebアプリ。
- Prisma + PostgreSQL を使用。
- Node.js 20.x 前提。

## High-level facts
- フレームワーク: Next.js 16 / React 18
- 言語: TypeScript（主要）
- ORM/DB: Prisma / PostgreSQL（`DATABASE_URL`必須）
- 画像/通知などで外部サービスを利用（例: Cloudinary, Web Push）

## Build & Validation
- 依存関係: `npm install`（必須）
  - 注意: `postinstall` で `prisma db push --accept-data-loss` が実行される。開発DB以外では実行に注意。
- 開発サーバ: `npm run dev`
- ビルド: `npm run build`
- 起動: `npm start`
- Lint: `npm run lint`
- テスト: 既定のテストスクリプトなし

必ず **npm install → lint → build** の順で確認。必要に応じて `DATABASE_URL` を設定してから実行。

## Project layout (重要)
- ルート設定
  - [package.json](../package.json): スクリプト/依存
  - [next.config.ts](../next.config.ts): Next.js設定
  - [eslint.config.mjs](../eslint.config.mjs): ESLint設定
  - [tsconfig.json](../tsconfig.json): TS設定
Prisma
  - [prisma/schema.prisma](../prisma/schema.prisma): DBスキーマ
  - [prisma/migrations](../prisma/migrations): マイグレーション
ソースコード
  - [src/app](../src/app): App Router（ページ/ルート）
  - [src/actions](../src/actions): サーバーアクション
  - [src/components](../src/components): 共有コンポーネント
  - [src/lib](../src/lib): Prismaクライアント等

## Agent guidance
- まずこのファイルの指示を信頼すること。記載が不足/不明確な場合のみ検索する。
- DB変更が必要なら `prisma/schema.prisma` とマイグレーションの整合を確認。
- 破壊的なDB操作は避ける（特に `db push --accept-data-loss`）。
