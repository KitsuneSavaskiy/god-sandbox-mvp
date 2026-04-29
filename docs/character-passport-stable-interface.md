# Character Passport 安定公開インターフェース方針

この資料は、Character Passport を育成ゲームと後続ゲームをつなぐ安定した公開JSONインターフェースとして扱うための方針です。

今回は docs-only です。Domain model、server export、smoke test、sample JSON、既存 tactics glossary、既存docsの大規模修正は行いません。

## 目的

Character Passport は、GodSandbox で育成したキャラクターを後続ゲーム、Mod、自作ツールへ渡すための公開JSON仕様です。

今後は、旧設計である五行を支配的なメタルールとして扱いません。旧「五行」は、安定Passport仕様では「属性」パラメータとして再定義します。

属性は有限パラメータの1つです。属性は職種、基本ステータス、状態異常、バフ、デバフ、Skill、Ability を自動決定しません。

## 事実

- 現行 origin/main には、`element` が `combatClass` を決める実装が残っている。
- server export には、`element` / `combatClass` mismatch を reject する処理が残っている。
- 既存docsには、五行と職種の1対1対応、五行がステータスや状態異常などを支配する説明が残っている。
- 監査役レビューでは、これらは最新合意と衝突する blocker 級の設計乖離として扱われている。
- 今回のPBIは、その実装差分を直す前に、新しい安定インターフェース方針を文書として固定する。

## 判断

- Character Passport は安定した公開インターフェースである。
- Character Passport は変換レイヤーでも projection layer でもない。
- 育成ゲームと後続ゲームは、Character Passport の公開JSON仕様でつなぐ。
- 共通パラメータ / 個別パラメータという分類は廃止する。
- 今後は単に「パラメータ」と呼ぶ。
- パラメータは有限個にする。
- 追加開発者によるパラメータ追加は禁止する。
- 育成イベントは、育成ゲーム側で定義済みのものだけを使う。
- 後続ゲーム開発者による育成イベント追加は禁止する。
- Domain / server export / samples / tactics glossary の追従は follow-up PBI に分ける。

## Character Passport の責務

Character Passport は、後続ゲームが安定して読める公開JSON仕様です。

Character Passport に含める情報は、育成ゲーム側が定義した有限パラメータと、その育成結果です。

Character Passport は、後続ゲームごとの形式へ都度変換する中間層ではありません。後続ゲームは、Character Passport の公開仕様を直接読んで実装します。

## 後続ゲーム側の自由

後続ゲームは、Character Passport の全項目を使う必要はありません。

後続ゲームに許されること:

- 必要なパラメータだけ読む。
- 不要なパラメータをスキップする。
- パラメータ名を自分のゲーム向けに変えて表示する。
- パラメータの意味を自分の世界観で解釈する。
- 属性を使う。
- 属性を使わない。
- Skill / Ability を自分の戦闘、会話、演出、成長システムへ読み替える。

後続ゲームに許されないこと:

- 育成ゲーム側のパラメータ定義そのものを追加する。
- 育成ゲーム側のパラメータ定義そのものを変更する。
- 育成イベントを追加する。
- Mod / plugin / extension を理由に、Passport core のパラメータ集合を増やす。

後続ゲーム側の自由は、読み取りと解釈の自由です。育成ゲーム側仕様の追加権限ではありません。

## パラメータ方針

パラメータは有限個です。

パラメータ同士は原則独立します。あるパラメータが別のパラメータを自動決定する設計は避けます。

たとえば、属性が職種を決めたり、職種がSkillを固定したり、GrowthがAbilityを自動決定したりする仕様は、安定Passport仕様の core には置きません。

後続ゲームは、複数パラメータを組み合わせて独自のゲーム内表現を作れます。ただし、それは後続ゲーム側の解釈であり、Character Passport core の支配ルールではありません。

## 属性方針

旧「五行」は、安定Passport仕様では「属性」パラメータとして扱います。

属性の方針:

- 属性は有限パラメータの1つである。
- 属性は `combatClass` を自動決定しない。
- 属性は基本ステータスを支配しない。
- 属性は状態異常を支配しない。
- 属性はバフを支配しない。
- 属性はデバフを支配しない。
- 属性はSkillを支配しない。
- 属性はAbilityを支配しない。
- 後続ゲームは属性を使ってもよい。
- 後続ゲームは属性を使わなくてもよい。
- 後続ゲームは属性名を自分の世界観に合わせて変更してよい。
- 後続ゲームは属性の意味を自分の世界観で解釈してよい。

属性は、後続ゲームの機能を制約しません。

## 五行の扱い

`wood` / `fire` / `earth` / `metal` / `water` を使う場合、それはPassport core の支配ルールではありません。

五行は、GodSandbox 標準世界観 preset、または legacy / historical concept として扱います。

安定Passport仕様では、次の考え方を廃止します。

- `wood = ranger` のような職種固定対応。
- 五行が基本ステータスを決める設計。
- 五行が状態異常を決める設計。
- 五行がバフやデバフを決める設計。
- 五行がSkillやAbilityを決める設計。

既存実装や既存docsに残っている五行依存は、follow-up PBI で整理します。

## 育成イベント方針

育成イベントは、育成ゲーム側で定義済みのものだけを使います。

後続ゲーム開発者は、育成イベントを追加しません。

後続ゲームは、育成イベントの内部仕様を知る必要はありません。Character Passport は、イベント処理そのものではなく、育成結果を渡します。

後続ゲームが読むべきものは、イベント定義ではなく、Character Passport に公開されたパラメータ値、Faith、Growth、Skill、Ability、見た目情報、成長要約です。

## 公開仕様に含める情報

Character Passport の公開仕様には、少なくとも次の情報を含める方向で検討します。

- schema version
- キャラクターID
- 名前
- パラメータ値
- 属性
- Faith
- Growth
- Skill
- Ability
- 見た目情報
- 成長要約

2D / 3D 連携は未決事項です。

2D画像前提のキャラクターを、3Dモデル利用の後続ゲームへどう渡すかは、別PBIで扱います。

## 変換レイヤー案の扱い

変換レイヤーをインターフェース層として持たせる案は廃止します。

ここでいう変換レイヤー案とは、育成ゲームの内部モデルと後続ゲームの読み取りモデルの間に、別の中間インターフェースを置く案です。

今後は、Character Passport の公開JSON仕様そのものを安定インターフェースとして扱います。

後続ゲームは、Character Passport を読み、自分のゲーム内モデルへ自由に取り込みます。その取り込み処理は後続ゲーム側の実装であり、Character Passport core の追加仕様ではありません。

## 未決事項

- 汎用パラメータの種類と数。
- `element` key を維持するか、`attribute` key へ schema breaking change するか。
- `combatClass` を独立パラメータとして残すか、optional にするか。
- 2D画像前提キャラクターを3Dモデル利用の後続ゲームへどう渡すか。
- Skill / Ability の `id` や `description` を開いたコンテンツとして許すか、v1では定義済み一覧に限定するか。
- 見た目情報の最小仕様。
- 成長要約の最小仕様。

## follow-up PBI候補

- `PBI-PASSPORT-DOMAIN-ATTRIBUTE-INDEPENDENCE-001`
- `PBI-PASSPORT-EXPORT-ATTRIBUTE-INDEPENDENCE-001`
- `PBI-PASSPORT-EXPORT-STRICTNESS-001`
- `PBI-DOCS-CREATOR-WORKFLOW-ALIGN-001`
- `PBI-PASSPORT-ASSET-BOUNDARY-001`
- Domain / server export / samples / tactics glossary の追従PBI

## 今回やらないこと

- Domain model 修正
- server export 修正
- smoke test 修正
- sample JSON 修正
- 既存 tactics glossary の全面修正
- 既存docs修正
- REST API
- frontend UI
- 実LLM接続
- provider設定UI
- API key保存
- package変更
- CI変更
