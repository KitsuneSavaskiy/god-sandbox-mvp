# Passport Paper Battle

このサンプルは、Character Passport のキャラクターを、別ゲーム側の1ユニットとして動かす小さな1対1対戦ゲームです。

完成した本番ゲームではありません。
GodSandboxで育てたキャラクターが、外のゲームで「表示され、移動し、攻撃し、被弾する」ことを見るための実験です。

## このサンプルでできること

- 自キャラ1体と敵キャラ1体を表示する
- 横10マス、縦5マスの盤面で遊ぶ
- 左5マスを自陣、右5マスを敵陣として扱う
- 自キャラを上下左右1マス移動する
- 同じ行で3マス以内の敵を攻撃する
- 敵が攻撃、または近づく
- 勝利、敗北を確認する

## 動かし方

repo root でローカルサーバーを起動します。

```bash
python -m http.server 8080
```

ブラウザで次を開きます。

```text
http://localhost:8080/sample-games/passport-paper-battle/
```

`file://` で直接開くと、ブラウザの制限で `sample-passport.json` を読めないことがあります。
その場合でも、同じ内容の予備データで画面は起動します。
サンプル内では、`/art/...` の画像参照を repo root の `public/art/...` から読めるようにしています。

## 操作

1. 「キャラを選ぶ」を押す、または盤面上の自キャラを選ぶ。
2. 光っている自陣マスを選ぶと移動する。
3. 同じ行で3マス以内の敵を選ぶと攻撃する。
4. 自キャラの行動後、敵が簡単な行動をする。
5. 敵HPを0にすると勝利。自キャラHPが0になると敗北。

## Character Passport のうち使っているもの

このサンプルの `sample-passport.json` は、次のような紹介カードです。

```json
{
  "schemaVersion": "1.0",
  "characterId": "ryo-sample-001",
  "displayName": "Ryo",
  "summary": "森の村で暮らす、まじめで少し不器用な若者。",
  "portraitImage": "/art/portraits/ryo/ryo_normal.jpeg",
  "tags": ["まじめ", "村人", "成長中"]
}
```

このサンプルが読むもの:

- `displayName`
- `portraitImage`
- `summary`
- `tags`

使わなくてよいもの:

- GodSandbox内部状態
- Faith / Growth / Chaos の生値
- tick
- UI state
- live context
- 内部domain model
- 戦闘用ステータス

## 戦闘値について

PassportにHPや攻撃力を必須にしません。

このサンプルでは、戦闘用の値をゲーム側で仮に決めています。

- HP: 10
- 攻撃力: 3
- 移動: 1ターンに上下左右1マス
- 射程: 同じ行で3マス

つまり、GodSandboxの内部ルールを知らなくても、このサンプルゲームはPassportを読めます。

## 見た目について

キャラは2Dの平面立ち絵として表示します。
盤面は、少し奥行きがあるように見えるマス目にしています。

最小アニメーション:

- idle: 通常
- move: 少し上下に揺れる
- attack: 少し前に出る
- damage: 少し下がって点滅する

画像差分が足りない部分は、CSSの動きで表現しています。

## 今回やらないこと

- 5対5
- 5人編成
- 本格タクティクス
- リアルタイム戦闘
- 複雑なスキル
- 属性相性
- 装備
- レベルアップ
- セーブ機能
- オンライン対戦
- SDK作成
- REST API
- npm package化
- LLM連携
- 本番ゲーム仕様の確定
