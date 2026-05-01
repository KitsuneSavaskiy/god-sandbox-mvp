# 起動トラブルシューティング

PBI-OPS-STARTUP-TROUBLESHOOTING-DOC-001 対応ドキュメント

---

## この文書の目的

GodSandbox を Windows / PowerShell / WSL で起動するときに、初心者がつまずきやすい点を短く整理します。

起動スクリプト本体の仕様を変える文書ではありません。
困ったときに「どの起動方法を使えばよいか」「どこを確認すればよいか」を見るための補助資料です。

---

## まず使う起動方法

### Windows で育成ゲーム本体を起動する

通常は `start.bat` を使います。

```bat
start.bat
```

PowerShell で起動する場合は `start.ps1` を使います。

```powershell
.\start.ps1
```

起動中は dev server が動き続けます。
終了するときは、起動したコマンドプロンプトまたは PowerShell の画面で `Ctrl+C` を押してください。

### サンプル対戦ゲームを起動する

Windows では通常 `start-sample-battle.bat` を使います。

```bat
start-sample-battle.bat
```

PowerShell で起動する場合は `start-sample-battle.ps1` を使います。

```powershell
.\start-sample-battle.ps1
```

サンプル対戦ゲームは、Python HTTP server で開く想定です。
`file://` で直接 `index.html` を開くと、JSON や画像の読み込みで失敗することがあります。

---

## PowerShell 5.1 で `.ps1` が文字化けする場合

Windows 標準の PowerShell 5.1 では、文字コードの扱いによって `.ps1` ファイルが文字化けしたり、`ParseException` が出たりする場合があります。

その場合は、次のどちらかを使ってください。

- `start.bat` を使う
- PowerShell 7 で `start.ps1` を使う

初心者向けには、まず `start.bat` を使う方法がいちばん分かりやすいです。

---

## WSL で `.sh` が `bash\r` エラーになる場合

WSL で `start.sh` や `start-sample-battle.sh` を実行したときに、次のようなエラーが出ることがあります。

```text
/usr/bin/env: 'bash\r': No such file or directory
```

原因は、`.sh` ファイルの改行コードが Windows 向けの CRLF になっていることです。
WSL / Linux では LF の改行が必要です。

このリポジトリでは、Git 側で `.sh` を LF に固定する方針です。
もし同じエラーが出る場合は、最新の `main` を取得しているか、`.gitattributes` による LF 固定が反映されているかを確認してください。

---

## WSL と Windows で `node_modules` を共有しない

Windows 側で作った `node_modules` を WSL 側でそのまま使うと、Rollup などの optional dependency が壊れることがあります。

Windows と WSL は、同じプロジェクトでも別の実行環境として扱うのが安全です。

WSL で動かす場合は、WSL 側で依存パッケージを入れ直してください。

```bash
npm install
```

Windows 側で動かす場合は、Windows 側の Node.js / npm を使ってください。

---

## サンプル対戦ゲームは HTTP で開く

サンプル対戦ゲームは、repo root から HTTP server を起動して開く想定です。

例:

```bash
python -m http.server 8080
```

ブラウザでは次を開きます。

```text
http://localhost:8080/sample-games/passport-paper-battle/
```

この方法なら、サンプルの JSON や `public/art/...` の画像を読み込みやすくなります。

---

## やってはいけないこと

### Explorer を Task Manager からむやみに終了しない

Windows のフォルダウィンドウは、`explorer.exe` という仕組みで動いています。
フォルダウィンドウを Task Manager から終了すると、デスクトップやスタートメニューまで一時的に消える場合があります。

その場合は、サインアウトまたは再起動で復旧してください。

### hidden window で初心者が起動しない

初心者向けの通常手順では、検証ツールなどから hidden window で起動する方法は推奨しません。

画面が見えない状態では、どのサーバーが動いているか、どこで止めればよいか分かりにくくなります。
通常は、見えるコマンドプロンプトまたは PowerShell の画面で起動し、終了時は `Ctrl+C` を押してください。

### 個人パス入りのローカルスクリプトを Git に入れない

自分のPCだけで使う起動メモやローカルスクリプトには、個人名や絶対パスが入ることがあります。

例:

```text
C:\Users\your-name\...
```

このようなファイルは、ほかの人のPCでは動かないことがあります。
Git に入れる前に、個人パスが入っていないか確認してください。

---

## 困ったときの切り分け

| 症状 | まず見ること |
|---|---|
| `start.ps1` で文字化けする | `start.bat` を使うか、PowerShell 7 を使う |
| WSL で `bash\r` と出る | `.sh` の改行コードが LF か確認する |
| WSL で build が失敗する | WSL 側で `npm install` しているか確認する |
| サンプル対戦ゲームで画像やJSONが読めない | `file://` ではなく HTTP server で開いているか確認する |
| デスクトップやスタートメニューが消えた | Explorer が不安定になった可能性があるため、サインアウトまたは再起動する |

---

## このPBIで変更しないもの

- `README.md`
- 起動スクリプト本体
- `.gitattributes`
- `src/**`
- `server/**`
- `sample-games/**`
- `package.json`
- `package-lock.json`
- `.github/**`
