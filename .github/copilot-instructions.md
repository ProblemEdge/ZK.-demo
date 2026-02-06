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

## Server Action の実装ルール（追加）

- **目的:** server action を作るときの安全性・検証・エラーハンドリングの統一ルール。
- **neverthrow の利用:** server action 内の非同期処理や副作用の結果表現には `neverthrow` を使い、成功/失敗を明確に扱ってください（例: `Result` を返す実装）。
- **必須の try/catch:** server action では必ず `try { ... } catch (error) { ... }` を置いてください。catch で受け取った `error` は直接クライアントに投げ返さず、必ず `lib/reportError(error: unknown)` を呼び出して報告してください。
- **クライアントへのエラーメッセージ:** クライアントには "明確に意味のあるエラー"（例: バリデーション失敗、認可エラー）のみを返し、それ以外は一般的な `unknown error` として扱って攻撃者に有用な内部情報を絶対に与えないでください。
- **パラメータ検証:** server action にパラメータがある場合、`lib/validation/*` などに `zod` のスキーマを定義し、必ず `safeParse` で検証してください。検証失敗はクライアントに適切なバリデーションエラーとして返してください。
- **エラーレポートの一元化:** catch で受け取ったエラーはすべて `lib/reportError(error: unknown)` で受け止めてください。将来的に Sentry 等へ送る場合は `lib/reportError` を拡張する想定ですので、個別で直接送らないようにしてください。
- **コード例（方針）:**

```ts
import { z } from 'zod'
import { err, ok } from 'neverthrow'
import { reportError } from '@/lib/reportError'
import { myParamsSchema } from '@/lib/validation/myParams'

export async function action(params: unknown) {
  const parsed = myParamsSchema.safeParse(params)
  if (!parsed.success) return err({ type: 'validation', details: parsed.error })

  try {
    // ビジネスロジック
    return ok({ /* success result */ })
  } catch (error) {
    reportError(error)
    return err({ type: 'unknown', message: 'unknown error' })
  }
}
```

- **ルール適用:** このファイルの Agent guidance を信頼して作業する際、server action を作る場合は上記ルールが適用されます。既存の server action を更新する際も、可能な範囲でこのスタイルに合わせることを推奨します。
