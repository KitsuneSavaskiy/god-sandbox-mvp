# Character Passport consumer sample

このサンプルは、GodSandbox で育てたキャラクター情報を、別のゲーム側で読む一番小さい例です。

ここでは、外部ゲームや自作ツールのことを **Passport consumer** と呼びます。むずかしく言うと「Character Passport を読む側」ですが、まずは「別ゲーム側」と考えてください。

## このサンプルで分かること

- Character Passport は、外へ渡すキャラクター紹介カードのようなJSONです。
- 別ゲーム側は、必要な項目だけ読めばよいです。
- 使わない項目は無視してよいです。
- 別ゲーム側では、仲間、敵、NPC、カード、村人などに自由に使い直してよいです。
- GodSandbox の内部状態や domain model をそのまま再現する必要はありません。

## ファイル

- `sample-passport.json`: 別ゲーム側が読むサンプルの Character Passport JSON
- `index.html`: ブラウザで見るための小さな画面
- `main.js`: JSONを読んで、画面に表示する処理

## 動かし方

まずは `index.html` をブラウザで開いてください。

ブラウザの制限で `sample-passport.json` を直接読めない場合があります。その場合でも、画面には同じ内容の予備データが表示されます。

実際にJSON読み込みと顔画像の表示を確認したい場合は、repo root で簡単なローカルサーバーを起動してください。

```bash
python -m http.server 8080
```

その後、ブラウザで次を開きます。

```text
http://localhost:8080/samples/passport-consumer/
```

この手順なら、`sample-passport.json` と `public/art/...` のRyo portrait画像を同じローカルサーバーから読めます。

## どの値を変えると表示が変わるか

`sample-passport.json` の次の値を変えると、画面の表示が変わります。

- `name`: キャラクター名
- `characterId`: 画像や外部ゲーム側の扱いを選ぶためのID
- `element`: 属性。別ゲーム側では自由に意味を変えてよいです。
- `combatClass`: 職種。属性から自動で決まるものではありません。
- `faith.trustBand`: 神への信頼の強さを、別ゲーム側の説明に使えます。

## このサンプルが読んでいる項目

このconsumerは、Character Passport の全項目を読みません。

画面表示に使うのは、主に次だけです。

- `characterId`
- `name`
- `element`
- `combatClass`
- `faith.trustBand`

`baseAttributes`、`growth`、`skills`、`abilities` は、今回は表示の補助として少しだけ使います。別ゲーム側で不要なら無視してかまいません。

## 外部ゲーム側での使い方例

このサンプルでは、Ryo を次のように読み替えています。

- 村人NPC
- 仲間候補
- カードゲームのユニット
- チュートリアル用キャラクター

このように、Character Passport の値は、後続ゲーム側で自由に再解釈できます。

## 今回やっていないこと

- 本格的な外部ゲーム制作
- SDK作成
- npm package作成
- REST API
- ログイン
- 認証
- オンライン連携
- export画面の本実装
- import画面の本実装
- LLM連携
- secret handling
- GodSandbox内部domain modelの変更

## 大事な境界

Character Passport は外へ渡すJSONです。

発話生成のための live context や、神との会話履歴ではありません。

別ゲーム側は、このJSONを読んで、自分のゲームに必要な形へ取り込めば十分です。
