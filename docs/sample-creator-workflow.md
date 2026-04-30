# AIキャラクター制作ワークフロー最小サンプル

この資料は、GodSandbox を AIキャラクター制作・育成・外部連携サンドボックスとして試すための最小ワークフローです。

対象読者は、AIキャラクターを作り、自作ゲーム、後続ゲーム、外部ツールへ持ち出したい開発者・Passport consumer開発者・技術寄りユーザーです。

Character Passport は、キャラクターを別のゲームへ連れて行くための紹介カードです。
このカードには、名前、画像につなげる手がかり、紹介文、性格タグを作るための情報などが入っています。
別のゲームは、このカードの中から必要な情報だけ使えば大丈夫です。
全部の項目を使う必要はありません。

たとえば、あるゲームでは仲間キャラとして使えます。
別のゲームでは、村人、敵、カード、図鑑の項目として使ってもかまいません。

このサンプルは実装ではありません。実LLM接続、BYOK / BYOM、provider設定UI、API key保存、外部ゲーム本体、battle logic は扱いません。

## このサンプルで見る流れ

1. GodSandboxでキャラクターを見る。
2. キャラクターが育つ、または状態が変わる。
3. 「キャラ情報をコピー」または同等の操作で Character Passport JSON を取り出す。
4. JSONの中身を見る。
5. consumer sample に渡す。
6. 別ゲーム側で名前、画像、紹介文、タグが表示されることを確認する。
7. 名前やタグの元になる値を変えると、表示も変わることを試す。
8. 自分のゲームでは、仲間、敵、NPC、カードなどに自由に使い直してよいことを確認する。

現在のrepoでは、画面からコピーする操作が未実装の場合があります。
その場合は、`samples/creator-workflow/character-passport.v1.json` や `samples/passport-consumer/sample-passport.json` を、取り出した後のJSON例として読んでください。

## 成果物

サンプルファイルは `samples/creator-workflow/` にあります。

- `sample-character-source.json`: Passport export 前のサンプルキャラ source snapshot
- `utterance-request.mock-template.json`: mock / template 発話へ渡す provider-neutral request
- `utterance-response.mock.json`: mock 発話の期待例
- `utterance-response.template.json`: template 発話の期待例
- `character-passport.v1.json`: 後続ゲームやPassport consumerが読む前提の Character Passport v1 JSON

## 1. キャラを作る

最小サンプルキャラは `Ren` です。

Ren は、サンプル上では `element` が `metal`、`combatClass` が `knight` のキャラです。

```text
element: metal
combatClass: knight
```

この組み合わせはサンプル上の選択であり、Character Passport v1 の固定契約ではありません。
`element` は wire format 上の既存keyとして維持されていますが、意味としては有限パラメータの1つである「属性」です。
`element` は `combatClass` を自動決定しません。
後続ゲームやPassport consumerは、必要なパラメータだけを読み、不要なパラメータはスキップできます。また、受け取ったパラメータ名や意味を自分のゲーム内で自由に再解釈できます。

キャラ作成時点で確認する主な情報は次の通りです。

- `characterId`: exportファイル名にも使う安全なID
- `name`: 表示名
- `element`: 属性
- `combatClass`: 職種
- `baseAttributes`: `vision / power / guard / discipline / flow`
- `faith`: 命令解釈、危険命令への反応、自律判断との距離
- `growth`: 加護、試練、カオス接触による成長
- `skills`: 能動的に使う行動
- `abilities`: 受動、反応、aura 系の効果

初心者向けには、まず `name`、`characterId`、`element`、`combatClass`、`faith.trustBand` だけ見れば十分です。
それ以外は、別ゲーム側で必要になったときに読めばかまいません。

## 2. 発話を見る

発話サンプルは実LLMを呼びません。

`samples/creator-workflow/utterance-request.mock-template.json` は、既存の Application boundary である `UtteranceRequest` と同じ考え方の provider-neutral な入力です。

mock / template provider は、この request から発話確認を行います。

```text
UtteranceRequest
  -> mock provider
  -> template provider
  -> UtteranceResponse
```

mock の期待例は `utterance-response.mock.json` です。

```json
{
  "status": "ok",
  "providerKind": "mock",
  "text": "Renは静かに状況を見つめている。"
}
```

template の期待例は `utterance-response.template.json` です。

```json
{
  "status": "ok",
  "providerKind": "template",
  "text": "Renは、試練の気配を前にして拳を握った。"
}
```

ここでは prompt全文、API key、user secret は扱いません。
Character Passport JSON も、AI会話モデルの内部履歴として扱いません。

## 3. Faith / Growth / Skill / Ability を確認する

Ren の `faith` は、単なる命令成功率ではありません。

このサンプルでは次の観点を見ます。

- `value`: Faith の丸め済み値
- `obedienceBias`: 命令へどの程度慎重に向き合うか
- `commandInterpretation`: 命令を文字通り受け取るか、文脈込みで解釈するか
- `hazardResponse`: 危険命令や危険状況への反応
- `autonomyAlignment`: 自律判断と神の命令のせめぎ合い
- `trustBand`: 外部ゲーム側がざっくり扱いやすい信頼帯
- `sources`: 加護、試練、カオス接触の寄与

`growth` は、成長の由来を見ます。

- `blessings`: 加護による成長
- `trials`: 試練による成長
- `chaosExposure`: カオス接触による変化

`skills` と `abilities` は別配列です。

- `skills`: Ren が能動的に使う `Iron Lunge`
- `abilities`: 条件に反応して発動する `Iron Vow`

この分離により、後続ゲームやPassport consumerは「行動として選ぶもの」と「条件で反応するもの」を混同せずに扱えます。

## 4. Character Passport をexportする

現在の server 側 smoke は、Character Passport v1 の export JSON と契約検査を確認できます。

```bash
npm run passport:smoke
```

このコマンドは、ローカルに次のファイルを出力します。

```text
god-sandbox-data/exports/character-passports/sample-ren.character-passport.json
```

`god-sandbox-data/` は実行時データであり、git 管理対象外です。

このPBIで追加する `samples/creator-workflow/character-passport.v1.json` は、後続ゲームやPassport consumerが読む形を理解するための静的サンプルです。
実行時に生成される export ファイルそのものではありません。

画面に「キャラ情報をコピー」のような操作がある場合は、その内容が Character Passport JSON です。
まだ画面操作がない場合は、上のサンプルJSONをコピーしたものとして扱ってください。

## 5. 後続ゲームやPassport consumerが読むJSONを確認する

後続ゲームやPassport consumerは、GodSandbox の内部状態を直接読むのではなく、Character Passport v1 JSON を読みます。

読み取り時の最小確認ポイントは次の通りです。

- `schemaVersion` が `character-passport/v1` である
- `originGame` が `god-sandbox-mvp` である
- `element` と `combatClass` が独立した値として読める
- `baseAttributes` が `vision / power / guard / discipline / flow` を持つ
- `faith` が命令解釈、危険反応、自律判断の情報を持つ
- `growth` が `blessings / trials / chaosExposure` を持つ
- `skills` と `abilities` が別配列になっている
- `attributes` / `history` / `rogue` の旧prototype要素へ依存していない

この境界により、GodSandbox は完成品ゲームとして閉じるのではなく、AIキャラクターを外へ渡す sandbox として扱えます。

後続ゲーム開発者は、育成ゲーム側のパラメータや育成イベントを追加しません。Character Passport の有限パラメータを読み、不要なものをスキップし、必要に応じて自分のゲーム内の名前や意味へ再解釈します。

## 6. consumer sample で別ゲーム側の表示を見る

別ゲーム側の一番小さい例は `samples/passport-consumer/` にあります。

ここでは、Character Passport JSON を読んで、次の情報を画面に出します。

- 名前
- 顔画像または代わりの表示
- 短い紹介文
- 属性、使い方例、信頼などのタグ
- Skill / Ability の説明例

確認手順は次の通りです。

1. `samples/passport-consumer/sample-passport.json` を開く。
2. 中身が Character Passport JSON であることを確認する。
3. repo root で `python -m http.server 8080` を実行する。
4. ブラウザで `http://localhost:8080/samples/passport-consumer/` を開く。
5. 名前、画像、紹介文、タグが表示されることを見る。
6. `sample-passport.json` の `name` や `element`、`combatClass`、`faith.trustBand` を少し変える。
7. ブラウザを再読み込みして、表示が変わることを見る。

`characterId` を変えると、サンプル内の画像対応が見つからず、画像の代わりに文字だけの表示になる場合があります。
これは失敗ではありません。別ゲーム側が「このキャラIDならこの画像を使う」と決めているだけです。

## 必須項目と任意項目の考え方

Character Passport を作る側は、安定したJSONとして必要な項目をそろえます。
一方で、別ゲーム側がすべての項目を使う必要はありません。

最初に読むと分かりやすい項目:

- `schemaVersion`: Passport の種類と版
- `characterId`: キャラクターを見分けるID
- `name`: 表示名

必要なら読む項目:

- `element`: 属性。別ゲーム側で名前や意味を変えてよい
- `combatClass`: 役割。属性から自動で決まるものではない
- `faith`: 神の声への向き合い方
- `growth`: 育った理由や変化
- `skills`: 行動として使えるもの
- `abilities`: 条件で出る特徴や反応

使わない項目は、無視してかまいません。
Character Passport は完全再現データではなく、別ゲームへ渡すキャラクター紹介状です。
別ゲーム側では、仲間、敵、NPC、カード、村人、図鑑データなどに自由に使い直してよいです。

## 今回やらないこと

- 実LLM接続
- BYOK / BYOM 実装
- provider設定UI
- API key保存
- secret handling 実装
- sample external game 本体
- battle logic
- UI変更
- server API 拡張
- package変更
- CI workflow変更
