# Character Passport 属性独立化 移行計画

この移行計画は、PBI-PASSPORT-ATTRIBUTE-POLICY-001 で定義される Character Passport stable interface 方針を前提とする。
PBI-PASSPORT-ATTRIBUTE-POLICY-001 の監査結果により方針が変更された場合、本移行計画は追従修正する。

## この資料の目的

この資料は、Character Passport の安定インターフェース方針に合わせて、既存実装と既存docsをどの順で修正するかを整理するためのdocs-only計画です。

このPBIでは、Domain、server export、smoke、sample JSON、既存docsを修正しません。修正対象、優先度、分割PBI、未決事項だけを固定します。

## 最新合意

### 判断

- 共通パラメータ / 個別パラメータの概念は廃止する。
- 今後は単に「パラメータ」と呼ぶ。
- パラメータは有限個にする。
- 追加開発者によるパラメータ追加は禁止する。
- 育成イベントも、育成ゲーム側で定義済みのものだけを使う。
- 後続ゲーム開発者による育成イベント追加は禁止する。
- 変換レイヤーをインターフェース層として持たせる案は廃止する。
- 育成ゲームと後続ゲームは、Character Passport の公開JSON仕様でつなぐ。
- 後続ゲームは必要なパラメータだけ読み、不要なものはスキップできる。
- 後続ゲームは、育成ゲームが定義したパラメータを自由に名前変更・解釈してよい。
- パラメータは後続ゲームの機能を制約しない。
- 五行カテゴリは、後続ゲーム開発者が解釈しやすい「属性」パラメータへ変更する。
- 属性は有限パラメータの1つにすぎない。
- 属性が職種、ステータス、状態異常、バフ、デバフ、Skill、Ability を支配的に決める仕様は廃止する。
- パラメータ同士は原則独立する。

### 事実

- 現行 origin/main には、五行が職種や他パラメータを支配する設計が docs と実装の両方に残っている。
- `element` が `combatClass` を決める実装が残っている。
- server export でも `element` / `combatClass` mismatch を reject している。
- docs でも五行と職種の1:1対応、ステータス等の五行従属が残っている。

### 未決事項

未決事項は後述の「未決事項」章で分離する。このPBIでは未決事項を実装判断へ進めない。

## 移行の目的

移行の目的は次の通り。

- 五行が職種や他パラメータを支配する実装・文書を廃止する。
- `element` を一般的な属性パラメータとして扱う。
- 属性と `combatClass` を独立させる。
- パラメータ同士を原則独立させる。
- Character Passport を有限パラメータの安定JSONインターフェースへ寄せる。

ここでいう安定JSONインターフェースとは、育成ゲームが公開仕様として出力し、後続ゲームが必要な項目だけを読み取れる契約を指す。

## blocker級の影響範囲

次の項目は、最新合意と直接矛盾するため blocker 級として扱う。

| 対象 | blocker内容 | 修正観点 |
| --- | --- | --- |
| `src/domain/passport/fivePhases.ts` | `element` と `combatClass` の1:1対応、各種 `*_BY_ELEMENT` が core に残っている | core から削除または preset-only へ隔離 |
| `src/domain/passport/characterPassport.ts` | Passport schema が五行従属の前提を含む可能性がある | 属性と職種を独立パラメータとして検証 |
| `src/domain/passport/characterPassport.test.ts` | 五行従属を正として固定している可能性がある | 新方針を characterization test へ変更 |
| `src/application/tactics/assembleTacticsUnit.ts` | `element` から tactics unit の性質を組み立てる可能性がある | 後続ゲーム側の自由解釈に寄せる |
| `server/character-passport.mjs` | `element` / `combatClass` mismatch reject が残っている | mismatch reject を廃止対象にする |
| `server/passport-contract-smoke.mjs` | `combatClassByElement` を正しい契約として固定する可能性がある | smoke を属性独立契約へ更新 |
| `docs/tactics-five-phases-glossary.md` | 五行と職種の1:1対応、ステータス等の五行従属が残る | historical / GodSandbox world preset へ隔離 |

## non-blockerだが追従が必要な影響範囲

次の項目は、直接のblockerではない可能性があるが、用語や説明の追従が必要。

| 対象 | 影響内容 | 修正観点 |
| --- | --- | --- |
| `docs/tactics-growth-and-abilities-glossary.md` | growth / ability が五行別ベクトル前提の可能性がある | 一般パラメータ別成長へ変えるか未決に戻す |
| `docs/sample-creator-workflow.md` | sample workflow が五行従属を前提にしている可能性がある | sampleの説明を属性独立方針に合わせる |
| `docs/creator-workflow-product-direction.md` | Character Passport の説明が旧方針と混在する可能性がある | 外部ゲームは必要パラメータのみ読む方針へ補強 |
| `docs/product-creator-persona-strategy.md` | creator / Modder向け説明に旧五行前提が混じる可能性がある | 追加開発者がパラメータ追加できない点を明記 |
| `docs/architecture-clean-boundaries.md` | Domain / Adapter境界と公開JSON仕様の説明を補強する必要がある | 変換レイヤー廃止、公開JSON仕様中心へ修正 |
| `server/README.md` | export仕様説明が旧方針とずれる可能性がある | server export の公開契約説明を更新 |
| `src/domain/passport/growth.ts` | growth が属性別ベクトル前提の可能性がある | 有限パラメータ方針に合わせる |
| `src/domain/passport/skill.ts` | Skill / Ability が属性従属の可能性がある | 属性がSkill / Abilityを支配しない方針へ修正 |
| `src/domain/tactics/unit.ts` | tactics unit が五行分類に依存する可能性がある | 後続ゲーム固有解釈へ寄せる |
| `src/application/passport/generateCharacterPassport.ts` | export生成時に旧方針を埋め込む可能性がある | 公開JSON仕様に合わせる |

## 影響ファイル一覧

監査で確認された影響範囲は次の通り。

### docs

- `docs/tactics-five-phases-glossary.md`
- `docs/tactics-growth-and-abilities-glossary.md`
- `docs/sample-creator-workflow.md`
- `docs/creator-workflow-product-direction.md`
- `docs/product-creator-persona-strategy.md`
- `docs/architecture-clean-boundaries.md`

### server docs / export

- `server/README.md`
- `server/character-passport.mjs`
- `server/passport-contract-smoke.mjs`

### Domain / Application

- `src/domain/passport/fivePhases.ts`
- `src/domain/passport/characterPassport.ts`
- `src/domain/passport/characterPassport.test.ts`
- `src/domain/passport/growth.ts`
- `src/domain/passport/skill.ts`
- `src/domain/tactics/unit.ts`
- `src/application/passport/generateCharacterPassport.ts`
- `src/application/tactics/assembleTacticsUnit.ts`

## 修正PBI分割案

### PBI-PASSPORT-DOMAIN-ATTRIBUTE-INDEPENDENCE-001

目的:
Domain model から `element -> combatClass` / `*_BY_ELEMENT` の支配ルールを外す。

主な対象:

- `src/domain/passport/fivePhases.ts`
- `src/domain/passport/characterPassport.ts`
- `src/domain/passport/characterPassport.test.ts`
- `src/domain/passport/growth.ts`
- `src/domain/passport/skill.ts`
- `src/domain/tactics/unit.ts`
- `src/application/passport/generateCharacterPassport.ts`
- `src/application/tactics/assembleTacticsUnit.ts`

注意:
五行を完全削除するのではなく、必要なら historical / world preset として隔離する。

### PBI-PASSPORT-EXPORT-ATTRIBUTE-INDEPENDENCE-001

目的:
server export / smoke / README / samples を属性独立方針へ更新する。

主な対象:

- `server/character-passport.mjs`
- `server/passport-contract-smoke.mjs`
- `server/README.md`
- sample JSON が存在する場合は該当sample

注意:
`element` / `combatClass` mismatch reject は廃止対象。

### PBI-PASSPORT-EXPORT-STRICTNESS-001

目的:
unknown growth key / unknown skill ability fields を reject または strip する。

理由:
Unknown field を許すと、有限パラメータ方針を迂回できるため。

主な対象:

- `server/character-passport.mjs`
- `server/passport-contract-smoke.mjs`
- `src/domain/passport/characterPassport.ts`
- `src/domain/passport/characterPassport.test.ts`

### PBI-DOCS-CREATOR-WORKFLOW-ALIGN-001

目的:
creator / Mod / plugin / external game 関連docsを最新合意へ合わせる。

主な対象:

- `docs/sample-creator-workflow.md`
- `docs/creator-workflow-product-direction.md`
- `docs/product-creator-persona-strategy.md`
- `docs/architecture-clean-boundaries.md`
- `server/README.md`

注意:
後続ゲーム開発者は必要なパラメータだけ読み、不要なものをスキップできることを明記する。

### PBI-TACTICS-FIVE-PHASES-LEGACY-PRESET-001

目的:
五行タクティクス資料を historical / GodSandbox world preset として隔離する。

主な対象:

- `docs/tactics-five-phases-glossary.md`
- `docs/tactics-growth-and-abilities-glossary.md`

注意:
五行は属性パラメータの1つとして扱い、職種、ステータス、状態異常、バフ、デバフ、Skill、Ability を支配しない。

### PBI-PASSPORT-ASSET-BOUNDARY-001

目的:
2D画像と3Dモデル連携の未決事項を整理する。

背景:
GodSandbox 側が2D画像前提キャラクターを扱う場合、後続ゲームが3Dモデルを使うときの渡し方が未決。

主な整理対象:

- Character Passport に asset reference を持たせるか
- 2D portrait / illustration と 3D model をどう分離するか
- 後続ゲームがassetを無視できるようにするか

## 推奨順序

推奨順序は次の通り。

1. PBI-PASSPORT-ATTRIBUTE-POLICY-001 を merge する。
2. PBI-PASSPORT-DOMAIN-ATTRIBUTE-INDEPENDENCE-001 で Domain を修正する。
3. PBI-PASSPORT-EXPORT-ATTRIBUTE-INDEPENDENCE-001 で server export / smoke を修正する。
4. PBI-PASSPORT-EXPORT-STRICTNESS-001 で unknown field の扱いを固定する。
5. PBI-DOCS-CREATOR-WORKFLOW-ALIGN-001 でdocsを最新合意へ合わせる。
6. PBI-TACTICS-FIVE-PHASES-LEGACY-PRESET-001 で五行資料を隔離する。
7. PBI-PASSPORT-ASSET-BOUNDARY-001 で2D / 3D asset boundaryを整理する。

理由:
Domain の意味を先に直さないまま server export を直すと、exportが旧Domainを包むだけになる。先にDomain、次にexport、次にdocs alignmentの順が安全。

## 実装修正時の注意

実装修正時は、次を注意する。

- `getCombatClassForElement` のような関数名は危険。
- `COMBAT_CLASS_BY_ELEMENT` / `ELEMENT_BY_COMBAT_CLASS` は core から削除または preset-only へ移す。
- `BASIC_ATTRIBUTE_BY_ELEMENT` / `STATUS_CONDITION_BY_ELEMENT` / `BUFF_BY_ELEMENT` / `DEBUFF_BY_ELEMENT` は core から外す。
- `element` / `combatClass` mismatch reject は廃止対象。
- smoke で `combatClassByElement` を正しい契約として固定しない。
- Unknown field を許すと有限パラメータ方針を迂回できるため、server strictness を強化する。
- 後続ゲーム側の自由な解釈を可能にするため、育成ゲーム側のパラメータ名を後続ゲーム側のクラスや戦闘仕様へ固定しない。
- 後続ゲームは必要なパラメータだけ読み、不要なものをスキップできるようにする。

## Domain / server / smoke / docs / sample 別の修正観点

### Domain

- 属性と `combatClass` を独立させる。
- 属性が他パラメータを支配しないようにする。
- 有限パラメータだけを許す。
- 定義済み育成イベントだけを扱う。

### server export

- 公開JSON仕様として、属性と職種の独立を受け入れる。
- mismatch reject を廃止する。
- unknown field の扱いを reject / strip のどちらかに固定する。
- 変換レイヤーではなく、公開JSON仕様を直接契約として扱う。

### smoke

- 旧五行従属を正として固定しない。
- 属性独立のサンプルを通す。
- unknown key の扱いを明示的に検証する。

### docs

- 五行を旧設計または world preset として扱う。
- 属性を一般パラメータとして説明する。
- 追加開発者によるパラメータ追加は禁止と明記する。
- 後続ゲーム開発者は育成ゲームが定義したパラメータを自由に名前変更・解釈してよいと明記する。

### sample

- サンプルJSONで `element` と `combatClass` の独立例を示す。
- 不要パラメータを後続ゲームがスキップできることを示す。
- 定義済みパラメータ以外を混ぜない。

## 未決事項

次の事項は、このPBIでは決めない。

- attribute の有限値を、五行から切り離した汎用 enum として新設するか。
- 既存 `element` key を維持して意味だけ属性に変えるか、`attribute` key へ schema breaking change するか。
- `combatClass` は完全独立パラメータとして残すか、後続ゲーム向けには optional にするか。
- `growth` を属性別ベクトルのままにするか、一般パラメータ別成長に変えるか。
- `skill` / `ability` の `id` や `description` を開いたコンテンツとして許すか、v1では定義済み一覧に限定するか。
- 2D画像前提キャラクターを3Dモデル利用の後続ゲームへどう渡すか。

## このPBIで実装しないこと

このPBIでは、次を実装しない。

- コード変更。
- server export 修正。
- smoke 修正。
- sample JSON 修正。
- 既存docs修正。
- package変更。
- CI workflow変更。

## 監査観点

監査では、次を見る。

- blocker級の五行依存が明記されているか。
- 影響ファイルが実ファイル名つきで整理されているか。
- 修正PBIが実行可能な粒度に分かれているか。
- 推奨順序がDomain、server export、smoke、docs、sampleの依存関係に沿っているか。
- 未決事項が実装判断として混入していないか。
- このPBIで実装修正に踏み込んでいないか。
