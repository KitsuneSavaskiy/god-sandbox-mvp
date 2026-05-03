# GodSandbox Agent Workspace Template

このフォルダは、プレイヤーが自分のPCへコピーして使うための外部補助ワークスペース雛形です。

GodSandbox本体のコードを変更するための場所ではありません。CodexやClaude Codeを別アプリとして開き、このフォルダを読ませることで、箱庭世界やキャラクター情報の整理を手伝ってもらう想定です。

## 使い方

1. `templates/agent-workspace/` を自分用の作業フォルダへコピーします。
2. コピー先の `AGENTS.md` をCodexに読ませます。
3. `world.md` に箱庭世界の説明を書きます。
4. `characters/` にキャラクターごとのメモを置きます。
5. 外部対話メモは `imports/` に置きます。
6. 外部サービスへ渡す下書きは `exports/` に作ります。

## フォルダ構成

```text
agent-workspace/
  AGENTS.md
  world.md
  save/
    current-session.example.json
  characters/
    example-character.md
  events/
  apostle-notes/
  imports/
  exports/
```

## 注意

- secret、API key、tokenを書かないでください。
- 個人PCの絶対パスを書かないでください。
- Git管理する前に、個人情報が入っていないか確認してください。
- Codex / ClaudeをGodSandboxアプリ内から起動する仕組みではありません。
- GodSandbox本体repoの `AGENTS.md` とは別物です。
