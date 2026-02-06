---
name: skill-factory
description: ユーザーの要望に合わせて、最適な言語で新しいAgent Skillを生成します。
---

## 手順
1. ユーザーが「〜するスキルを作って」と言ったら、タスクの特性を分析。
2. Rust, TS, Pythonから最適なものを選択。
3. `skills/[name]/` ディレクトリを作成。
4. ルートの `package.json`, `Cargo.toml`, `pyproject.toml` に新しい依存が必要なら追加を提案。
5. 言語に合わせたバリデーション（Valibot/Clap/Pydantic）を含む `main` ファイルを作成。
6. `SKILL.md` を作成し、ルートからの正しい実行コマンドを記述。

## 実行例

```bash
# TypeScript スキルを生成
node ./bin/cli.js skill --name example --lang ts --desc "example skill"
```
