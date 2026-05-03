# GodSandbox Player Agent Workspace Template

このフォルダは、GodSandbox のプレイヤーが自分用にコピーして使う agent workspace テンプレートです。

GodSandbox 本体の開発フォルダではありません。

## 何に使うか

- 箱庭世界の設定を整理する。
- キャラクター情報をまとめる。
- 外部ChatGPTやClaudeへ渡す説明文の下書きを作る。
- Character Passport や soul file の下書きを `exports/` に作る。

## 使い方

1. この `templates/agent-workspace/` フォルダを、自分用の分かりやすい場所へコピーします。
2. Codex / Claude Code CLI などを、GodSandboxとは別アプリとして起動します。
3. その別アプリで、コピーしたフォルダを開きます。
4. 最初に `AGENTS.md` を読ませます。
5. 必要に応じて `world.md`、`characters/**`、`save/current-session.json` を更新します。

## フォルダ構成

```text
AGENTS.md
world.md
save/
characters/
events/
apostle-notes/
imports/
exports/
```

## 各フォルダの役割

- `AGENTS.md`: Codex / Claude に読ませる、この作業フォルダ用のルールです。
- `world.md`: 箱庭世界の正本メモです。
- `save/`: GodSandboxから手動で持ち出した現在状態を置きます。
- `characters/`: キャラクターごとの設定や記憶メモを置きます。
- `events/`: 印象に残った出来事やイベントメモを置きます。
- `apostle-notes/`: 使徒の案内や気づきのメモを置きます。
- `imports/`: 外部対話や手動で持ち込んだメモを置きます。
- `exports/`: 外部ChatGPTやClaudeへ渡す下書きを置きます。

## 安全ルール

- 個人PCの絶対パスを書かないでください。
- secret、API key、token、パスワードを書かないでください。
- Git管理する前に、個人情報が入っていないか確認してください。
- 外部サービスへ送る内容は、必ずユーザー自身が確認してください。
- このテンプレートはAPI連携や自動送信を前提にしません。

## 本体repoとの違い

このテンプレートは、プレイヤーが自分のCodexに読ませる作業フォルダです。

GodSandbox 本体repoの `AGENTS.md` や `CLAUDE.md` は、開発エージェント向けです。

このテンプレートの `AGENTS.md` は、ゲームプレイヤーの箱庭整理を手伝う外部補助エージェント向けです。
