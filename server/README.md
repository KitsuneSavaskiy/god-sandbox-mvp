# god-sandbox-api

Local REST API skeleton for development use (PBI-BE-API-001).

Built with Node.js standard `http` module — no external dependencies.

## Start

```bash
npm run api:dev
# or
PORT=8787 node server/rest-api.mjs
```

## Endpoints

| Method | Path           | Description              |
|--------|----------------|--------------------------|
| GET    | /api/health    | Server liveness check    |
| POST   | /api/login     | Stub login               |
| GET    | /api/session   | Stub session check       |
| POST   | /api/logout    | Stub logout              |

### GET /api/health

```json
{ "ok": true, "service": "god-sandbox-api" }
```

### POST /api/login

Request body:
```json
{ "playerName": "Kitsune" }
```

Response:
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

## Notes

- CORS is open (`*`) for local development.
- No persistent session or real authentication.
- Front-end integration is out of scope for this PBI.

---

# god-sandbox-local-game-data

Local file storage layer for game data (PBI-BE-FS-001).

Uses only Node.js standard `fs/promises` and `path` — no external dependencies, no REST server.

## Data root

`god-sandbox-data/` is created in the working directory at runtime and is git-ignored.

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

All directories are created upfront by `initDirs()`.

## API

| Function | Description |
|---|---|
| `initDirs()` | Create all data directories |
| `readConfig()` | Read local config JSON |
| `writeConfig(data)` | Write local config JSON |
| `readSave(saveName)` | Read a named save JSON |
| `writeSave(saveName, data)` | Write a named save JSON |
| `readSession(sessionName)` | Read a named session JSON |
| `writeSession(sessionName, data)` | Write a named session JSON |

Returns `null` if the file does not exist. Throws on malformed JSON.
`saveName` / `sessionName` must not contain `/`, `\`, or `..`.

## Smoke test

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

| Function | Description |
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
