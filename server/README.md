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

## drift 防止

`server/character-passport.mjs` は `PASSPORT_EXPORT_CONTRACT` を公開し、server 側で使う export 契約のローカル定義を一箇所に集約します。
`npm run passport:smoke` は smoke 専用の `server/passport-contract-smoke.mjs` を読み込み、TypeScript AST 経由で `src/domain/passport/**` の canonical 定義と照合します。

これにより、次の定義が Domain と server export adapter でズレた場合は smoke が失敗します。

- `schemaVersion`
- `fivePhaseElements`
- `combatClasses`
- `baseAttributes`
- Faith 関連 enum
- `growthCategories`

## 何ができるか

- Character Passport v1 の export JSON を組み立てる
- Application source snapshot から export 形へ変換する
- `god-sandbox-data/exports/character-passports/` に保存する
- smoke コマンドで、adapter と file write の最小確認ができる

## 主要API

| 関数 | 説明 |
|---|---|
| `PASSPORT_EXPORT_CONTRACT` | server export adapter が参照する契約スナップショット |
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
  "combatClass": "mage",
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

- `element` は wire format 上の既存 key だが、意味としては有限パラメータの1つである「属性」
- `element` と `combatClass` は独立した値であり、server export は組み合わせを強制しない
- `baseAttributes` は `vision / power / guard / discipline / flow`
- `faith` は value だけでなく、命令解釈・危険命令への反応・自律判断寄りの項目を含む
- `growth` は `blessings / trials / chaosExposure` を持つ
- `skills` は能動行動、`abilities` は受動 / 反応 / aura 効果

## `combatClass`

v1 では次の 5 種のみ許可します。

- `ranger`
- `mage`
- `guardian`
- `knight`
- `healer`

`combatClass` は `element` から自動決定しません。
後続ゲームは必要なパラメータだけ読み、不要なものはスキップできます。
後続ゲームは、受け取った属性名や意味を自分のゲーム内で自由に再解釈できます。

## `characterId`

`characterId` は export ファイル名に使われます。
安全のため、空文字、`/`、`\`、`..` を含む値は拒否します。

## export strictness

server export は、育成ゲームが公開する正規の Character Passport を作る側です。
そのため、安定JSONインターフェースで許可していない unknown field は reject します。

MVPでは strip ではなく reject を優先します。
unknown field を黙って削ると、入力側の設計ミスや未定義拡張に気づきにくいためです。

特に `growth` の unknown key、`skills` の unknown field、`abilities` の unknown field は `npm run passport:smoke` で拒否を確認します。

これは後続ゲーム側が不要な既知パラメータをスキップできる方針とは矛盾しません。
server export は正規Passportを作る側であり、後続ゲームはPassportを読む側です。

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

これで次の 6 点を確認できます。

1. Domain 寄りの Passport export JSON が生成できる
2. `god-sandbox-data/exports/character-passports/` に保存できる
3. `schemaVersion` が `character-passport/v1` になっている
4. `element` と `combatClass` が独立した値として保存される
5. `characterId` の path traversal / slash を拒否できる
6. Domain canonical 定義と server export contract が drift していない
7. `growth` / `skills` / `abilities` の unknown field を拒否できる

## 今回まだ含まないもの

- REST API
- フロントエンドからの呼び出し
- 認証
- DB
- タクティクス戦闘ゲーム本体との接続
