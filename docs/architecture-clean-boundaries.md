# Clean Architecture 境界ガイド

この資料は、今後の五行パラメータ、Character Passport、local storage、REST 連携、タクティクス連携が密結合にならないようにするための設計ガイドです。

これは実装ではありません。既存ファイルの移動、依存関係の変更、DI コンテナ導入、REST 実装、DB 実装はこの資料では行いません。

## 目的

- Domain / Application / Adapter / Presentation の責務を分け、密結合を防ぐ。
- Character Passport とタクティクス連携を拡張しやすくする。
- 保存方式や REST 連携を Domain から切り離す。
- Web / Node / mobile の platform 差を Adapter で吸収できるようにする。
- 初見の開発者が、どこに何を置くべきか判断できる状態にする。

## レイヤー定義

```text
Domain:
純粋なゲームルール。

Application:
ユースケースと port 定義。

Adapter / Infrastructure:
保存、ファイル、API、外部連携。

Presentation:
React UI、画面、ユーザー操作。
```

## 依存方向

```text
Presentation -> Application -> Domain
Adapter -> Application ports
Domain は外側を知らない
```

Domain は React、ファイル保存、HTTP、localStorage、REST API、画面レイアウトを知りません。
Application は Domain のルールを使ってユースケースを組み立て、外部入出力は port として定義します。
Adapter は Application port を実装し、ファイル、HTTP、browser storage、mobile storage などの platform 差を吸収します。
Presentation は UI とユーザー操作を担当し、直接保存処理や export schema の組み立てを行いません。

## Domain に入れるもの

```text
- world rules
- character rules
- five phases
- faith
- growth
- skills
- abilities
- status conditions
- Character Passport の意味
```

Domain は「何が正しいゲーム概念か」を持ちます。
たとえば信仰度（Faith）、成長（growth）、特殊能力（abilities）、状態異常、五行の相生 / 相剋、Character Passport が表す意味は Domain の責務です。

## Domain に入れてはいけないもの

```text
- React
- JSX
- fs/promises
- HTTP
- fetch
- localStorage
- file paths
- UI layout
```

Domain は保存先、表示方法、通信方式、実行環境を知ってはいけません。
`domain/world.ts` が `fs/promises` を import するような構造は避けます。

## Application に入れるもの

```text
- ExportCharacterPassport
- SaveWorld
- LoadWorld
- ApplyDivineCommand
- repository ports
```

Application は「何をするか」というユースケースを担当します。
たとえば Character Passport を export する、世界を保存する、世界を読み込む、神の命令を適用する、といった処理をまとめます。

Application は保存や通信の実装を直接持たず、repository port や service port を通じて Adapter に依存方向を反転させます。

## Adapter / Infrastructure に入れるもの

```text
- local file storage
- REST bridge
- localStorage adapter
- Character Passport JSON export
```

Adapter は外部世界との接続を担当します。
Node.js の file storage、browser の localStorage / IndexedDB、mobile の app sandbox file / secure storage、remote sync、REST API などは Adapter です。

同じ port に対して、Web / Node / mobile で別々の Adapter を用意できるようにします。

## Presentation に入れるもの

```text
- EventModal
- WorldViewport
- LoginScreen
- ApostlePanel
- CommandConsole
```

Presentation は画面、操作、表示状態を担当します。
`CommandConsole` のような Web UI に寄った入力は、Application へ UI 非依存の command DTO として渡します。
Presentation は直接ファイル保存したり、Character Passport JSON を組み立てたりしません。

## DTO / schema と Domain model の違い

Domain model はゲーム概念と不変条件を表します。
DTO / schema は transport / persistence contract です。
両者は似た形になることがありますが、同じものとして扱いません。

```text
Domain model:
ゲーム内の意味、不変条件、ルールを表す。

DTO / schema:
保存、通信、import / export のための外部契約を表す。
```

`DTOの意味: Domain` とは書きません。
正しくは、DTO の各 field が参照する概念や制約は Domain にあり、DTO 自体は Application / contract または Adapter 境界の契約として扱います。

## Character Passport の配置方針

```text
意味・型・必須項目:
Domain

ファイル出力:
Adapter / server
```

Character Passport v1 は、domain concept と export schema を分けて考えます。

```text
Domain:
キャラクターが何者か、faith / growth / abilities が何を意味するか。

Export schema:
外部ゲームへ渡す JSON contract。

Adapter:
JSON をファイルへ書き出す処理。
```

Character Passport は将来 versioned contract として扱います。
`schemaVersion`、必須 field、enum 値、互換性ルールは schema 側で明示します。

## local storage / file storage の配置方針

```text
保存処理:
Adapter

保存する対象の意味:
Domain

保存ユースケース:
Application
```

保存処理は Domain に入れません。
保存先が localStorage、IndexedDB、Node.js file system、mobile secure storage、remote sync のどれであっても、Domain のルールは変わらない状態を目指します。

## 将来 RESTful 連携の配置方針

```text
REST API:
Adapter

REST APIで渡すDTO:
Application / contract

DTOの意味:
Domain concept を参照するが、DTO 自体は Domain model ではない
```

REST endpoint、HTTP status、request / response の JSON 形式は Domain に入れません。
REST API は Adapter として Application port を呼び出します。

## platform 別 Adapter 方針

将来の Web / Node / mobile 展開を見据え、platform 固有処理は Adapter に閉じます。

推奨する将来配置イメージ:

```text
src/domain/
src/application/
src/infrastructure/web/
src/infrastructure/node/
src/infrastructure/mobile/
src/presentation/web/
src/presentation/mobile/
```

現時点でこの構成へ一気に移動する必要はありません。
新しい PBI で保存・通信・mobile 依存が増えるときに、上記の境界へ寄せます。

## Composition root

Composition root は、Application port と Adapter 実装を束ねる配線点です。
DI コンテナは必須ではありませんが、どこで依存を組み立てるかは明確にします。

```text
Composition root:
- port にどの adapter を渡すか決める
- web / node / mobile の adapter 差し替え点になる
- Presentation から Application を呼ぶ入口を組み立てる
```

Composition root は Domain に置きません。
Web なら frontend entry 付近、Node.js なら server entry 付近、mobile なら mobile app entry 付近に置く想定です。

## 境界での validation / sanitization

外部入力は、Adapter / Application 境界で検証します。
Domain も不変条件を守りますが、ファイル名、HTTP body、import JSON、チャット命令などの外部由来値は境界で先に検証します。

検証対象の例:

```text
- file path / file name
- REST request body
- Character Passport import / export
- divine command / chat command
- saveName / sessionName / characterId
- schemaVersion
```

特に file path に使う値は、`/`、`\`、`..` などのパストラバーサル要素を拒否します。
認証情報や将来の同期 token は Presentation に置かず、platform-secure storage adapter に閉じます。

## 禁止例

```text
- WorldViewport が直接 god-sandbox-data に保存する
- EventModal が Character Passport JSON を直接組み立てる
- domain/world.ts が fs/promises を import する
- server/local-game-data.mjs が React UI の型を知る
```

これらはレイヤー境界を越えており、将来の mobile 展開や外部ゲーム連携を難しくします。

## World tick / divine command の方針

World tick と divine command は、現時点では既存実装を維持します。
将来、保存、mobile background 制約、外部コマンド連携が入る場合は、Application のユースケースと port に寄せます。

```text
World tick:
Domain rule を使うが、実行スケジューリングは Application / Presentation / platform 側で扱う。

divine command:
UI 入力をそのまま Domain に渡さず、Application 用の command DTO に変換してから扱う。
```

## レイヤーごとのテスト方針

```text
Domain:
純粋関数・ルール・不変条件を unit test で固定する。

Application:
port を fake / stub に差し替え、ユースケース単位で test する。

Adapter:
file system、REST、browser storage などの入出力を smoke / integration test で確認する。

Presentation:
主要導線、表示、ユーザー操作、runtime error の有無を smoke test で確認する。
```

Domain test は UI 障害とゲームルールの正常挙動を切り分けるための基準になります。
Adapter test は path validation や schema validation の抜け漏れを検出する役割を持ちます。

## 今後の PBI 順序

```text
1. architecture doc
2. tactics glossary fix
3. domain types
4. application ports
5. local export adapter
6. REST bridge
```

この順序は、既存機能を壊さずに境界を固定していくための推奨順です。
大規模なファイル移動や DI コンテナ導入は、必要になるまで行いません。

