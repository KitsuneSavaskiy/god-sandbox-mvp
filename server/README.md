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

Character Passport v1 のローカル出力層です。

箱庭で育てたキャラクターを、あとで別ゲームへ持ち出すための JSON を作ります。
今回は **ローカルファイルへ出力するだけ** で、REST API やフロント接続は行いません。

## 接続方針

Character Passport の意味は `src/domain/passport/**` を正とします。
server 側は、その意味を import して会話モデル化するのではなく、**export 契約の整形と file write を吸収する adapter** として扱います。

```text
Application source snapshot / Domain draft
  -> server/character-passport.mjs
  -> Character Passport export JSON
  -> god-sandbox-data/exports/character-passports/*.json
```

`Character Passport JSON` は export contract であり、内部会話モデルではありません。

## 何ができるか

- Character Passport v1 の export JSON を組み立てる
- Application source snapshot から export 形へ変換する
- `god-sandbox-data/exports/character-passports/` に保存する
- smoke コマンドで、adapter と file write の最小確認ができる

## 主要API

| 関数 | 説明 |
|---|---|
| `createCharacterPassportV1(input)` | Domain 寄りの draft から Character Passport v1 export JSON を組み立てる |
| `adaptCharacterPassportSourceToExport(source)` | Application source snapshot を export JSON へ変換する adapter |
| `writeCharacterPassportFile(passport)` | Passport JSON をローカルファイルへ保存する |

## Character Passport v1 の最小仕様

必須の最小項目は次のとおりです。

```json
{
  "schemaVersion": "character-passport/v1",
  "characterId": "sample-ren",
  "name": "Ren",
  "originGame": "god-sandbox-mvp",
  "element": "metal",
  "combatClass": "knight",
  "baseAttributes": {
    "vision": 2,
    "power": 3,
    "guard": 5,
    "discipline": 6,
    "flow": 2
  },
  "faith": {
    "value": 50,
    "obedienceBias": "cautious",
    "commandInterpretation": "measured",
    "hazardResponse": "guarded",
    "autonomyAlignment": "balanced",
    "trustBand": "steady",
    "sources": {
      "blessings": 1,
      "trials": 2,
      "chaosExposure": 0
    }
  },
  "growth": {
    "blessings": {
      "wood": 0,
      "fire": 0,
      "earth": 0,
      "metal": 1,
      "water": 0
    },
    "trials": {
      "wood": 0,
      "fire": 0,
      "earth": 1,
      "metal": 2,
      "water": 0
    },
    "chaosExposure": {
      "wood": 0,
      "fire": 0,
      "earth": 0,
      "metal": 0,
      "water": 0
    }
  },
  "skills": [],
  "abilities": []
}
```

## 既存 server-only prototype との差分

以前の `server/character-passport.mjs` は、`attributes` / `history` / `rogue` などの server-only 仮スキーマを持っていました。
PBI-PASSPORT-EXPORT-INTEGRATION-001 以降は、それを延命せず、Domain で確定した次の意味へ寄せます。

- `element` と `combatClass` は 1:1 固定
- `baseAttributes` は `vision / power / guard / discipline / flow`
- `faith` は value だけでなく、命令解釈・危険命令への反応・自律判断寄りの項目を含む
- `growth` は `blessings / trials / chaosExposure` を五行ごとに持つ
- `skills` は能動行動、`abilities` は受動 / 反応 / aura 効果

## `combatClass`

v1 では次の 5 種のみ許可します。

- `ranger`
- `mage`
- `guardian`
- `knight`
- `healer`

対応は固定です。

```text
wood  = ranger
fire  = mage
earth = guardian
metal = knight
water = healer
```

## `characterId`

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

これで次の 5 点を確認できます。

1. Domain 寄りの Passport export JSON が生成できる
2. `god-sandbox-data/exports/character-passports/` に保存できる
3. `schemaVersion` が `character-passport/v1` になっている
4. `element` と `combatClass` の固定対応違反を拒否できる
5. `characterId` の path traversal / slash を拒否できる

## 今回まだ含まないもの

- REST API
- フロントエンドからの呼び出し
- 認証
- DB
- タクティクス戦闘ゲーム本体との接続
