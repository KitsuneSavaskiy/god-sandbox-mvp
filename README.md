# god-sandbox-mvp

Private MVP repository for a god-sandbox prototype managed with Codex.

Bot routine PR smoke test 4.

---

## 起動方法

### 事前確認

ゲームを起動するには **Node.js (v18 以上推奨)** が必要です。

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

## Getting Started (for developers)

### Requirements

- **Node.js 22.x** — [nodejs.org](https://nodejs.org/)
- **npm** (bundled with Node.js)
- **Git**

### Setup

```bash
git clone https://github.com/KitsuneSavaskiy/god-sandbox-mvp.git
cd god-sandbox-mvp
npm ci
```

### Run frontend

```bash
npm run dev
```

Open `http://localhost:5173/` in your browser.

### Basic flow

1. Login screen appears — enter any name to proceed.
2. The sandbox world loads and ticks automatically.
3. Events fire periodically; an EventModal pops up with choices.
4. Select a choice to apply world intervention and continue.

### Checks

```bash
npm run typecheck    # TypeScript type check
npm run test:domain  # Domain unit tests
npm run build        # Production build
```

### Troubleshooting

| Problem | Solution |
|---|---|
| `npm run dev` fails to start | Make sure Node.js 22.x is installed and `npm ci` completed successfully. |
| Black screen after launch | Open DevTools Console (F12) and check for errors. |
| Port 5173 already in use | Stop the other process using port 5173, or run `npm run dev -- --port 5174` to use a different port. |
