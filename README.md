This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Brave Search (MCP) — Claude デスクトップ連携

簡単な手順:

- `npm install @modelcontextprotocol/server-brave-search --save`
- Claude デスクトップの設定ファイルを編集します（Windows の場合）: `%APPDATA%\\Claude\\claude_desktop_config.json`
- 既存ファイルは自動的にバックアップしてください（例: `.bak_YYYYMMDDHHMMSS`）。
- 設定に以下の `mcpServers` エントリを追加し、`YOUR_API_KEY_HERE` を Brave Search ダッシュボードで発行した実際の API キーに置き換えてください。

```
{
	"mcpServers": {
		"brave-search": {
			"command": "npx",
			"args": [
				"-y",
				"@modelcontextprotocol/server-brave-search"
			],
			"env": {
				"BRAVE_API_KEY": "YOUR_API_KEY_HERE"
			}
		}
	}
}
```

- 設定編集後、Claude デスクトップを再起動すると MCP ツールとして Brave Search が利用可能になります。
- 注意:
	- Node.js がインストールされている必要があります（推奨: Node 20.x）。
	- `@modelcontextprotocol/server-brave-search` はメンテナンス状況が変わる可能性があるため、公式ドキュメントを確認してください。

参考: https://brave.com/ja/search/api/guides/use-with-claude-desktop-with-mcp/
