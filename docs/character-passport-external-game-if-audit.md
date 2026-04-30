# Character Passport 外部ゲームIF仕様 自由度監査

この資料は、Character Passport が外部ゲーム開発者の自由度を損なっていないかを確認するためのdocs-only監査メモです。

ここでは、Character Passport を「完全再現データ」ではなく、後続ゲームが自由に使えるキャラクター紹介状として扱います。

このPBIでは export実装、import実装、UI、REST API、認証、外部ゲームSDK、画像生成API連携、domain model の大規模変更は行いません。

## 監査の目的

GodSandbox の重要な価値は、育成ゲームで作ったキャラクターを他のゲームへ気軽に持ち出せることです。

そのため、Character Passport は次の条件を満たす必要があります。

- 後続ゲームが GodSandbox の内部仕様に縛られない。
- 後続ゲームが必要な項目だけ読める。
- 後続ゲームが不要な項目を安全に無視できる。
- 後続ゲームが 3D化、カード化、NPC化、敵化、仲間化などへ自由に再解釈できる。
- Passport と live context が混ざらない。
- schemaVersion により、将来の後方互換を管理できる。

## 事実

- Character Passport は、外部ゲームへ渡す安定JSONインターフェースとして整理されている。
- Character Passport は、発話生成などの live context とは分離する方針になっている。
- `schemaVersion` は `character-passport/v1` として export JSON に含まれている。
- 後続ゲームは、必要な既知パラメータだけ読み、不要な既知パラメータをスキップできる方針になっている。
- server export は、正規Passportを作る側として unknown field を reject する方針になっている。
- 属性は有限パラメータの1つであり、職種、基本ステータス、状態異常、バフ、デバフ、Skill、Ability を支配しない方針になっている。

## 判断

- 現方針は、外部ゲーム側の自由な解釈を重視する方向へ進んでいる。
- Character Passport は、GodSandbox の内部domain modelをそのまま外部へ漏らすものではなく、外部利用向けに固定された公開JSON仕様として扱うべきである。
- 後続ゲーム側の必須実装は、最小限に抑えるべきである。
- 後続ゲームは Passport の全項目を実装しなくてよい。
- 2D画像として最低限持ち出すための asset / portrait 情報は、まだ明確化が必要である。
- schemaVersion の後方互換ポリシーは、存在だけでなく運用ルールも追加で整理する価値がある。

## 外部ゲーム開発者向けIF監査観点

外部ゲーム開発者向けIFとして、次を継続的に確認します。

- Passport の各fieldが、外部利用に必要な公開仕様か。
- GodSandbox 内部の一時状態、live context、prompt、会話履歴、secret が混ざっていないか。
- 後続ゲームが不要な既知fieldを無視しても破綻しないか。
- 後続ゲームが `element`、`combatClass`、`faith`、`growth`、`skills`、`abilities` をすべて実装しなくてもよいか。
- 後続ゲームが 2D portrait だけを使う実装を選べるか。
- 後続ゲームが Passport を 3D avatar、カード、NPC、敵、仲間、召喚ユニット、図鑑データなどへ再解釈できるか。
- `schemaVersion` を見て、対応できないversionを安全に拒否または degrade できるか。
- Passport を live context の代替として扱っていないか。

## Character Passport v1 の必須項目と任意項目

ここでは、export producer側の必須項目と、後続ゲーム consumer側の必須項目を分けます。

### export producer側の必須項目

育成ゲームが正規Passportを出力する側では、安定JSONインターフェースに沿って必要fieldを埋めます。

現時点のv1で中心になる項目:

- `schemaVersion`
- `characterId`
- `name`
- `originGame`
- `element`
- `combatClass`
- `baseAttributes`
- `faith`
- `growth`
- `skills`
- `abilities`

server export は、安定仕様に含まれない unknown field を reject します。
これは、未定義の追加パラメータを暗黙に許さないためです。

### 後続ゲーム consumer側の必須項目

後続ゲーム側が最低限読むべき項目は、用途によって変わります。

最小の安全確認としては、次を推奨します。

- `schemaVersion`: 自分が読めるversionか判断するため。
- `characterId`: 保存、参照、ログ、対応表に使うため。
- `name`: 表示名やデバッグ表示に使うため。

それ以外の既知fieldは、後続ゲームの用途に応じて読むか無視できます。

たとえば、カードゲームなら `skills` と `abilities` を読む一方で、`combatClass` を無視してもよいです。
会話NPCゲームなら `faith` や成長要約を読む一方で、戦闘用の数値を無視してもよいです。
敵キャラ生成ツールなら `name`、`element`、`baseAttributes` だけを読み、`abilities` を独自AI行動へ読み替えてもよいです。

## 無視してよい項目の扱い

後続ゲームは、不要な既知fieldをスキップできます。

スキップしてよい例:

- `element` を使わないゲームでは、属性を無視してよい。
- `combatClass` を使わないゲームでは、職種を無視してよい。
- 戦闘がないゲームでは、`skills` や `abilities` を演出テキストとしてだけ使ってよい。
- Faithを使わないゲームでは、`faith` を表示しない、または関係性のヒントとしてだけ使ってよい。
- Growthを使わないゲームでは、`growth` を読み飛ばしてよい。

ただし、unknown field を追加して独自パラメータとして持ち込むことは別問題です。
server export は正規Passportを作る側なので unknown field を reject します。
後続ゲームは既知fieldのうち不要なものをスキップできます。

## 内部状態を外部IFに漏らさない方針

Character Passport には、外部利用に必要な安定情報だけを含めます。

含めないもの:

- prompt全文
- API key
- user secret
- live conversation context
- 発話生成時の一時request
- provider固有設定
- localStorage / fs / HTTP の内部都合
- GodSandbox内部の一時的なUI状態
- デバッグ専用の履歴や未整理フィールド

Passport は、GodSandbox の内部domain objectを丸ごと公開するものではありません。
field名がDomain側の語彙と似ていても、外部IFに含める理由は「後続ゲームが使える公開情報であること」に置きます。

## 2D / 3D / カード / NPC への再解釈

後続ゲームは、Passport を自分の表現へ自由に変換できます。

許容される再解釈:

- 2D portrait キャラとして表示する。
- 3Dモデルに割り当てる。
- カードゲームのカードへ変換する。
- NPCとして会話対象にする。
- 敵キャラとして出す。
- 仲間ユニットとして出す。
- 図鑑やプロフィールとして表示する。
- `element` や `combatClass` の表示名を自分の世界観に合わせて変える。
- `skills` や `abilities` を、戦闘効果ではなく演出、称号、性格タグとして扱う。

現時点の改善点:

- 2D画像キャラとして最低限持ち出すための `portrait` / `appearance` / `asset` 境界が未確定。
- 3Dモデル利用ゲームへ渡す場合、2D画像、3D model reference、生成ヒント、外部asset ID のどれをPassportに含めるか未決。
- 画像やモデルの実体をPassportへ埋め込むか、参照だけ持つか未決。

このため、asset境界は follow-up PBI で扱います。

## schemaVersion と後方互換

`schemaVersion` は、後続ゲームが対応可否を判断するための入口です。

推奨方針:

- 後続ゲームは、未対応の `schemaVersion` を安全に拒否できる。
- 後続ゲームは、対応済みversionで不要な既知fieldをスキップできる。
- v1内でfield意味を大きく変えない。
- breaking change が必要な場合は、別versionにする。
- 新version追加時は、v1 consumer が壊れない移行方針を用意する。

未決事項:

- minor version を導入するか。
- v1で optional field を追加できる範囲をどこまで許すか。
- deprecated field を何version維持するか。
- asset情報を入れる場合、v1拡張か v2 か。

## Passport と live context の分離

Character Passport は live context ではありません。

Passport が担うもの:

- キャラクターID
- 名前
- 公開パラメータ
- 属性
- Faith
- Growth
- Skill
- Ability
- 見た目や成長要約の公開情報
- versioned export contract

Passport が担わないもの:

- 発話生成のrequest / response全体
- prompt全文
- 会話履歴そのもの
- 現在のセッション状態
- provider credential
- 一時的な感情メモやUI状態

後続ゲームが会話AIを持つ場合でも、Passport は会話AIの内部記憶ではなく、キャラクター紹介状として読みます。

## 監査結果

### 良い点

- Character Passport が外部ゲーム向けの安定JSONインターフェースとして定義されている。
- 後続ゲームは必要なパラメータだけ読み、不要な既知fieldをスキップできる方針がある。
- 属性は他パラメータを支配しない方針へ整理されている。
- server export は unknown field を reject し、未定義パラメータ追加を防ぐ方向になっている。
- Passport と live context を混ぜない方針がある。

### リスク

- v1の必須項目が多く見えるため、後続ゲーム consumer側まで全項目実装が必要だと誤解される可能性がある。
- 2D画像として最低限持ち出すasset境界が未確定。
- schemaVersion の後方互換運用がまだ十分に文書化されていない。
- `faith`、`growth`、`skills`、`abilities` がDomain用語に見えるため、外部IFとしての意味を継続的に説明する必要がある。

### 改善案

- consumer向け最小読み取り例を追加する。
- `schemaVersion` の互換ポリシーを明文化する。
- `portrait` / `appearance` / `asset` 境界を整理する。
- 後続ゲームが `skills` / `abilities` を戦闘以外へ読み替えてよい例を増やす。
- Character Passport v1 の producer必須項目と consumer最小項目をREADMEやサンプルにも反映する。

## follow-up PBI候補

- `PBI-PASSPORT-CONSUMER-MINIMAL-READ-001`
- `PBI-PASSPORT-SCHEMA-VERSION-POLICY-001`
- `PBI-PASSPORT-ASSET-BOUNDARY-001`
- `PBI-PASSPORT-CONSUMER-EXAMPLES-001`
- `PBI-PASSPORT-README-CONSUMER-GUIDE-001`

## 今回やらないこと

- export実装
- import実装
- UI実装
- REST API実装
- 認証
- 外部ゲームSDK
- 画像生成API連携
- domain model の大規模変更
- package変更
- CI workflow変更
