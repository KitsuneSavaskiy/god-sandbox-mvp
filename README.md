# god-sandbox-mvp

Codex と一緒に開発している、神視点箱庭プロトタイプの非公開 MVP リポジトリです。

自動作業 PR の smoke test 記録: 4。

---

## 起動方法

### 事前確認

ゲームを起動するには **Node.js 22.x 推奨** が必要です。

- [Node.js 公式サイト](https://nodejs.org/) からダウンロードできます。
- インストールされていない場合、起動スクリプトがダウンロードページを案内します。

---

### Windows の場合

`start.bat` をダブルクリックするか、コマンドプロンプトで以下を実行してください。

```bat
start.bat
```

---

### macOS の場合

ターミナルを開き、このリポジトリのフォルダに移動してから以下を実行してください。

```bash
./start.sh
```

初回実行時は実行権限を付与する必要がある場合があります。

```bash
chmod +x start.sh
./start.sh
```

---

### 共通の手順

1. スクリプトが Node.js / npm のインストールを確認します。
2. 未インストールの場合、ダウンロードページへの案内が表示されます。
3. 依存パッケージが自動でインストールされます（初回のみ時間がかかります）。
4. 開発サーバーが起動し、ブラウザで `http://localhost:5173` を開くとゲームが遊べます。
5. 終了するには `Ctrl+C` を押してください。

---

## 開発者向けセットアップ

### 必要なもの

- **Node.js 22.x** — [nodejs.org](https://nodejs.org/)
- **npm** (Node.js に同梱)
- **Git**

### セットアップ

```bash
git clone https://github.com/KitsuneSavaskiy/god-sandbox-mvp.git
cd god-sandbox-mvp
npm ci
```

### フロントエンド起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173/` を開いてください。

### 基本の流れ

1. ログイン画面が表示されます。任意の名前を入力すると進めます。
2. 箱庭世界が読み込まれ、tick が自動で進みます。
3. 条件を満たすと EventModal が開き、介入の選択肢が表示されます。
4. 選択肢を選ぶと世界への介入が適用され、進行が続きます。

### 確認コマンド

```bash
npm run typecheck    # TypeScript type check
npm run test:domain  # Domain unit tests
npm run build        # Production build
```

### トラブルシュート

| 問題 | 対応 |
|---|---|
| `npm run dev` が起動しない | Node.js 22.x が入っていることと、`npm ci` が成功していることを確認してください。 |
| 起動後に黒画面になる | DevTools Console (F12) を開き、runtime error が出ていないか確認してください。 |
| Port 5173 が使用中 | 5173 番を使っている別プロセスを止めるか、`npm run dev -- --port 5174` で別ポートを使ってください。 |

---

### 任意: ローカル REST API

別ターミナルでローカル API サーバーを起動します。

```bash
npm run api:dev
```

サーバーは `http://localhost:8787` で待ち受けます。

疎通確認:

```bash
curl http://localhost:8787/api/health
```
