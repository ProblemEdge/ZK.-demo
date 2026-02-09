# 連続投稿カウント（streak）機能 仕様書

## 概要

- 目的: 投稿が「承認」されるたびにユーザーの連続投稿カウントを更新し、プロフィールに「現在の連続」と「最大連続」を表示する。
- 振る舞い: 投稿が「否定（rejected/denied）」された場合、現在の連続を0にリセットする。

## 仕様

- 定義: 同一ユーザーの投稿が時系列において承認され続ける限り連続カウントを増加させる。否定が挟まったら連続は途切れ、0から再スタートする。
- 対象イベント: 投稿ステータスが `pending` → `approved` に遷移したタイミングでインクリメント。`pending` → `rejected`、または後で `rejected` に変更された場合はリセット。
- 時間制約: デフォルトでは時間（例: 日跨ぎ）は考慮しない。必要なら別仕様で拡張する。
- 一貫性: DB トランザクションまたは原子的更新で処理する。同時更新競合への対策（悲観ロックまたは原子的 UPDATE）を講じる。

## DB 変更（Prisma 想定）

- `User` モデルに以下を追加する（デフォルト 0）:
  - `currentStreak Int @default(0)`
  - `maxStreak Int @default(0)`
- オプション: `lastApprovalAt DateTime?` を追加して承認日時を保持することも可能。

### 例（Prisma スニペット）

```prisma
model User {
	id            String   @id @default(cuid())
	// ...既存フィールド...
	currentStreak Int      @default(0)
	maxStreak     Int      @default(0)
	// lastApprovalAt DateTime?
}
```

## サーバー側 実装手順

- 実装箇所: 投稿承認処理を行うサーバーアクション／管理API（例: `src/actions/post.ts` や管理APIルート）を修正または拡張する。
- コーディング規約（既存プロジェクト方針に合わせる）:
  - `neverthrow` を用いて `ok` / `err` を返す。
  - 常に `try { ... } catch (error) { reportError(error); return err({ type: 'unknown', message: 'unknown error' }) }` を入れる。
  - 入力は `zod` スキーマで `safeParse` して検証する。検証失敗は `validation` エラーとして返す。
- トランザクションを用いて以下を原子的に実行する：投稿ステータス更新 → ユーザーの streak 更新。

## 承認フロー（擬似コード）

1. リクエスト受信（投稿ID等の検証）。
2. トランザクション開始。
3. 投稿のステータスを `approved` に更新。
4. ユーザーの `currentStreak` を `currentStreak + 1` にする。
5. `maxStreak < currentStreak` の場合 `maxStreak = currentStreak` に更新。
6. トランザクションコミット。
7. 成功は `ok(...)` を返す。例外時は `reportError` を呼び `err({ type: 'unknown', message: 'unknown error' })` を返す。

### DB 原子的更新 例（擬似SQL）

- 承認時:
  ```sql
  UPDATE users
  SET currentStreak = currentStreak + 1,
  		maxStreak = GREATEST(maxStreak, currentStreak + 1)
  WHERE id = :userId;
  ```
- 否定時:
  ```sql
  UPDATE users
  SET currentStreak = 0
  WHERE id = :userId;
  ```

## 否定（rejected）処理

- 投稿が `rejected` になった場合、該当ユーザーの `currentStreak` を 0 に設定する。`maxStreak` は変更しない。

## フロントエンド（プロフィール表示）

- 表示箇所: プロフィール画面に `現在の連続投稿` と `最大連続投稿` を追加する（例: `src/app/profile/...`）。
- データ取得: ユーザー情報取得 API に `currentStreak`, `maxStreak` を含める。必要なら軽量な専用エンドポイントを作る。
- 表示例:
  - 現在の連続投稿: 3
  - 最大連続投稿: 10

## 受け入れ基準

- 投稿を承認すると、その投稿の作者の `currentStreak` が +1 される。
- `currentStreak` が `maxStreak` を超えた場合 `maxStreak` が更新される。
- 投稿が `rejected` になったら `currentStreak` が 0 になる。
- 同時承認リクエストが発生しても整合性を保てる（トランザクション／原子的更新で確認）。

## テストケース

- 正常系:
  - 連続承認を3回行い `currentStreak` が 3、`maxStreak` が更新されること。
  - `currentStreak` が `maxStreak` を越えたとき `maxStreak` が更新されること。
- 異常系/境界:
  - 投稿が `rejected` になったとき `currentStreak` が 0 に戻ること。
  - 並列承認が発生しても整合性が保たれること（トランザクションで検証）。
- エラーハンドリング:
  - 入力バリデーション失敗は `validation` エラーで返る。
  - 未知例外は `reportError` を呼び、クライアントには `unknown error` を返す。

## マイグレーションとデプロイ手順（簡潔）

1. `prisma/schema.prisma` にフィールドを追加する。
2. マイグレーションを作成: `npx prisma migrate dev --name add-streaks`（開発）
   - 本番DBでは `prisma db push` を不用意に実行しないこと。
3. サーバーアクションを実装し、ユニット/結合テストを作成する。
4. CI でテストを通す。
5. 本番へデプロイ。必要なら過去データを計算するバックフィル用スクリプトを作成する。

---

この指示書をそのまま `docs/連続投稿-streak.md` として追加、あるいは `prisma/schema.prisma` と `src/actions` 用の PR 向けパッチを生成します。どちらを希望しますか？
