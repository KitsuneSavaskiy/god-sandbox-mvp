# god-sandbox-mvp

Codex と一緒に開発している、神視点箱庭プロトタイプの非公開 MVP リポジトリです。

自動作業 PR の smoke test 記録: 4。

---

## 起動方法

このリポジトリの起動スクリプトは、スクリプト自身の場所からリポジトリのルートを見つけます。
個人PCの絶対パスやユーザー名は使わないため、clone または download した場所が違っても同じ手順で起動できます。

### 事前確認

育成ゲーム本体を起動するには **Node.js 22.x 推奨** が必要です。

- [Node.js 公式サイト](https://nodejs.org/) からダウンロードできます。
- インストールされていない場合、起動スクリプトがダウンロードページを案内します。

---

### 育成ゲーム本体を起動する

起動後、ブラウザで `http://localhost:5173` を開くとゲームを確認できます。

#### Windows の場合

`start.bat` をダブルクリックするか、コマンドプロンプトで以下を実行してください。

```bat
start.bat
```

PowerShell から起動する場合は、以下を実行してください。

```powershell
.\start.ps1
```

---

#### macOS / Linux の場合

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

#### 育成ゲーム本体の共通手順

1. スクリプトが Node.js / npm のインストールを確認します。
2. 未インストールの場合、ダウンロードページへの案内が表示されます。
3. 依存パッケージが自動でインストールされます（初回のみ時間がかかります）。
4. 開発サーバーが起動し、ブラウザで `http://localhost:5173` を開くとゲームが遊べます。
5. 終了するには `Ctrl+C` を押してください。

---

### 起動スクリプトを安全に止める

起動スクリプトは、通常のコマンドプロンプトまたは PowerShell の画面で実行してください。

起動中は、育成ゲーム本体の dev server や、サンプル対戦ゲーム用の Python HTTP server が動き続けます。
終了する時は、起動した画面で `Ctrl+C` を押してください。

初心者向けの通常手順では、検証ツールなどから hidden window で起動する方法は推奨しません。
画面が見えない状態では、どのサーバーが動いているか、どこで止めればよいか分かりにくくなるためです。

Windows では、フォルダウィンドウも `explorer.exe` という仕組みで動いています。
フォルダウィンドウをタスクマネージャから終了すると、デスクトップやスタートメニューまで一時的に消えることがあります。
その場合は、サインアウトまたは再起動で復旧してください。

---

### サンプル対戦ゲームを起動する

`sample-games/passport-paper-battle/` は、Character Passport のキャラを別ゲーム側で表示して動かす小さなサンプルです。
画像や JSON を正しく読むため、`file://` で HTML を直接開かず、ローカルHTTPサーバーから開いてください。

起動後、ブラウザで `http://localhost:8080/sample-games/passport-paper-battle/` を開きます。

#### Windows の場合

`start-sample-battle.bat` をダブルクリックするか、コマンドプロンプトで以下を実行してください。

```bat
start-sample-battle.bat
```

PowerShell から起動する場合は、以下を実行してください。

```powershell
.\start-sample-battle.ps1
```

#### macOS / Linux の場合

ターミナルを開き、このリポジトリのフォルダに移動してから以下を実行してください。

```bash
./start-sample-battle.sh
```

初回実行時は実行権限を付与する必要がある場合があります。

```bash
chmod +x start-sample-battle.sh
./start-sample-battle.sh
```

#### Python がない場合

サンプル対戦ゲームの起動には、ローカルHTTPサーバー用に Python が必要です。
Python が見つからない場合は、[Python 公式サイト](https://www.python.org/) からインストールしてください。
Windows では `python` または `py -3`、macOS / Linux では `python3` または `python` を使います。

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
