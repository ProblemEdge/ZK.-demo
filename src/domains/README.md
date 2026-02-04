# ドメイン駆動設計ガイド

このディレクトリには、アプリケーションのドメインロジックが含まれています。各ドメインは `schema.ts` と `hooks.ts` で構成されています。

## ディレクトリ構成

```
domains/
├── user/           # ユーザー関連
├── badges/         # バッジ関連
├── quests/         # クエスト関連
├── posts/          # 投稿関連
└── notifications/  # 通知関連
```

## 各ドメインの構成

### schema.ts
- Zodを使用したバリデーションスキーマ定義
- フォームとAPI両方で再利用可能
- TypeScript型の自動生成

### hooks.ts
- useSWRを使用したデータフェッチング
- CRUD操作の実装
- スキーマを使用したデータ検証

## 使用方法

### データ取得の例

```typescript
import { useCurrentUser } from '@/domains/user';

function MyComponent() {
  const { user, isLoading, error } = useCurrentUser();
  
  if (isLoading) return <div>読み込み中...</div>;
  if (error) return <div>エラーが発生しました</div>;
  
  return <div>{user?.username}</div>;
}
```

### データ更新の例

```typescript
import { updateUserProfile } from '@/domains/user';

async function handleUpdate() {
  try {
    await updateUserProfile({
      displayName: '新しい名前',
      bio: '新しいプロフィール',
    });
  } catch (error) {
    console.error('更新に失敗しました:', error);
  }
}
```

### スキーマバリデーションの例

```typescript
import { createPostSchema } from '@/domains/posts';

const result = createPostSchema.safeParse({
  imageUrl: 'https://example.com/image.jpg',
  caption: 'テスト投稿',
  tags: 'test',
});

if (result.success) {
  console.log('バリデーション成功:', result.data);
} else {
  console.error('バリデーション失敗:', result.error);
}
```

## 利点

1. **型安全性**: Zodスキーマから自動的にTypeScript型が生成される
2. **再利用性**: スキーマをフォームとAPIで共有できる
3. **保守性**: ドメインごとにロジックが整理されている
4. **テスタビリティ**: ドメインロジックを独立してテストできる

## ベストプラクティス

1. UIコンポーネントでは直接 `fetch` や `useSWR` を使わず、必ずドメインフックを使用する
2. 新しいエンティティを追加する場合は、対応するドメインディレクトリを作成する
3. スキーマは厳密に定義し、必要に応じてバリデーションルールを追加する
4. APIレスポンスは必ずスキーマでバリデーションする
