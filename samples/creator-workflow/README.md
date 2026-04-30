# Creator Workflow Sample

このディレクトリは、AIキャラクター制作ワークフローの最小サンプルです。

GodSandbox を「キャラを作る -> 発話を見る -> 成長情報を確認する -> Character Passport をexportする」流れで理解するための静的ファイルを置きます。

## ファイル

- `sample-character-source.json`: Passport export adapter へ渡す前のサンプルキャラ source snapshot
- `utterance-request.mock-template.json`: mock / template 発話へ渡す provider-neutral request
- `utterance-response.mock.json`: mock 発話の期待例
- `utterance-response.template.json`: template 発話の期待例
- `character-passport.v1.json`: 後続ゲームやPassport consumerが読む前提の Character Passport v1 JSON

## 確認手順

1. `sample-character-source.json` で Ren の element / combatClass / Faith / Growth / Skill / Ability を見る。
2. `utterance-request.mock-template.json` を見て、発話入力に secret や provider 固有設定が含まれないことを確認する。
3. `utterance-response.mock.json` と `utterance-response.template.json` で、実LLMなしの発話例を見る。
4. `character-passport.v1.json` を後続ゲームやPassport consumerの読み取り対象として確認する。
5. 実際の server export smoke は `npm run passport:smoke` で確認する。

## 境界

このサンプルは実LLM、BYOK / BYOM、provider設定UI、API key保存、外部ゲーム本体、battle logic を実装しません。

Character Passport JSON は外部連携 contract であり、AI会話モデルの内部履歴ではありません。
`element` は wire format 上の既存 key ですが、意味としては有限パラメータの1つである「属性」です。
`element` は `combatClass` を自動決定しません。
後続ゲームやPassport consumerは、必要なパラメータだけを読み、不要なパラメータはスキップできます。
このサンプルの `element` と `combatClass` の組み合わせは固定契約ではなく、後続ゲーム側で自由に再解釈できます。
