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
