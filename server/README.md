# god-sandbox-api

開発用のローカル REST API ひな形です (PBI-BE-API-001)。

Node.js 標準の `http` モジュールだけで作られており、外部依存はありません。

## 起動

```bash
npm run api:dev
# or
PORT=8787 node server/rest-api.mjs
```

## エンドポイント

| Method | Path           | 説明                     |
|--------|----------------|--------------------------|
| GET    | /api/health    | サーバーの疎通確認       |
| POST   | /api/login     | 仮ログイン               |
| GET    | /api/session   | 仮セッション確認         |
| POST   | /api/logout    | 仮ログアウト             |

### GET /api/health

```json
{ "ok": true, "service": "god-sandbox-api" }
```

### POST /api/login

リクエスト body:
```json
{ "playerName": "Kitsune" }
```

レスポンス:
```json
{ "ok": true, "user": { "id": "local-user", "name": "Kitsune" }, "token": "local-dev-token" }
```

### GET /api/session

```json
{ "ok": true, "authenticated": false }
```

### POST /api/logout

```json
{ "ok": true }
```

## 注意点

- ローカル開発用に CORS は `*` で開いています。
- 永続セッションや実認証はまだありません。
- フロントエンド接続はこの PBI の範囲外です。

---

# god-sandbox-local-game-data

ゲームデータ用のローカルファイル保存層です (PBI-BE-FS-001)。

Node.js 標準の `fs/promises` と `path` だけを使います。外部依存や REST サーバーはありません。

## データルート

`god-sandbox-data/` は実行時に作業ディレクトリ直下へ作られます。このディレクトリは git 管理対象外です。

```text
god-sandbox-data/
  config/
    local-config.json
  saves/
    <saveName>.json
  sessions/
    <sessionName>.json
  characters/
  exports/
    character-passports/
```

必要なディレクトリは `initDirs()` によって先に作成されます。

## API

| 関数 | 説明 |
|---|---|
| `initDirs()` | 必要なデータディレクトリを作成する |
| `readConfig()` | ローカル設定 JSON を読む |
| `writeConfig(data)` | ローカル設定 JSON を書く |
| `readSave(saveName)` | 指定名の save JSON を読む |
| `writeSave(saveName, data)` | 指定名の save JSON を書く |
| `readSession(sessionName)` | 指定名の session JSON を読む |
| `writeSession(sessionName, data)` | 指定名の session JSON を書く |

ファイルが存在しない場合は `null` を返します。壊れた JSON は例外にします。
`saveName` / `sessionName` には `/`、`\`、`..` を含めてはいけません。

## smoke test

```bash
npm run data:smoke
```

---

# god-sandbox-character-passport

Character Passport v1 のローカル出力層です (PBI-BE-FS-002)。

箱庭で育てたキャラクターを、あとで別ゲームへ持ち出すための JSON を作ります。
今回は **ローカルファイルへ出力するだけ** です。REST API やフロント接続は行いません。

## 何ができるか

- Character Passport v1 の JSON を作る
- `god-sandbox-data/exports/character-passports/` に保存する
- smoke コマンドで、初見の開発者でも出力結果をすぐ確認できる

## 主要API

| 関数 | 説明 |
|---|---|
| `createCharacterPassportV1(input)` | Character Passport v1 の JSON を組み立てる |
| `writeCharacterPassportFile(passport)` | Passport JSON をローカルファイルへ保存する |

## Character Passport v1 の最小仕様

必須の最小項目は次のとおりです。

```json
{
  "schemaVersion": "character-passport/v1",
  "characterId": "sample-ren",
  "name": "Ren",
  "originGame": "god-sandbox-mvp",
  "combatClass": "rogue",
  "faith": {
    "value": 50,
    "obedienceBias": "cautious"
  },
  "attributes": {
    "hp": 8,
    "attack": 3,
    "defense": 2,
    "will": 4,
    "vision": 5,
    "stealth": 3,
    "support": 1,
    "chaosAffinity": 2
  },
  "abilities": [],
  "history": {
    "blessings": [],
    "trials": [],
    "chaosEvents": []
  }
}
```

### `combatClass`

今の v1 では次の 4 種のみ許可します。

- `vanguard`
- `mage`
- `rogue`
- `healer`

### `characterId`

`characterId` は export ファイル名に使われます。
安全のため、空文字、`/`、`\`、`..` を含む値は拒否します。

## 出力先

```text
god-sandbox-data/
  exports/
    character-passports/
      sample-ren.character-passport.json
```

`writeCharacterPassportFile()` は、先に `initDirs()` を呼んで必要ディレクトリを作成してから保存します。

## smoke test

```bash
npm run passport:smoke
```

これで次の 3 点を確認できます。

1. Passport JSON が生成できる
2. `god-sandbox-data/exports/character-passports/` に保存できる
3. `schemaVersion` が `character-passport/v1` になっている

## 今回まだ含まないもの

- REST API
- フロントエンドからの呼び出し
- 認証
- DB
- タクティクス戦闘ゲーム本体との接続
