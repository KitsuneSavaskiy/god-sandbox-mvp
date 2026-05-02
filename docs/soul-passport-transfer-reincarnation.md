# Soul Passport Transfer / Reincarnation / Heroic Spirits Design

PBI-SOUL-PASSPORT-TRANSFER-REINCARNATION-DESIGN-001 対応ドキュメント

## 概要

GodSandbox で育ったキャラクターを、Character Passport JSON だけでなく、会話用の魂メモ、世界観メタ設定、画像と一緒に外部へ持ち出す設計を整理する。

本資料では、ユーザーが ChatGPT / Claude の project folder 相当の作業領域へファイルを手動アップロードし、そのキャラクターの「魂」と会話する運用を前提にする。

今回は docs-only であり、実装、Passport schema 変更、外部 API 連携、UI 変更は行わない。

## 目的

- 箱庭で育ったキャラクターを、外部対話に耐える最小ファイルセットとして持ち出せるようにする。
- Character Passport を安定公開 JSON のまま保ちつつ、会話人格や世界観説明を sidecar ファイルへ分離する。
- 外部対話後に箱庭へ戻すとき、`転移` と `転生` の2系統で再観察できる設計を先に整理する。
- 死亡キャラクターを `英霊` として別管理し、外部へ持ち出せるメタ情報の形を決める。

## 前提と設計原則

- Character Passport JSON は、安定した公開インターフェースとして維持する。
- 会話人格、話し方、禁則、外部対話メモは Passport core に直接混ぜない。
- 外部連携は API 連携ではなく、ユーザーの手動ファイル操作を正本にする。
- ChatGPT / Claude の製品固有機能には依存しない。依存するのは「ファイルをアップロードして参照させられる」運用だけに留める。
- prompt 全文、secret、API key、ローカル環境名、個人アカウント設定は出力ファイルに含めない。
- 死亡キャラクターは削除ではなく、英霊アーカイブへ移して再参照可能にする。

## 用語

- Soul Passport bundle:
  Character Passport と sidecar ファイルをまとめた外部持ち出し用セット。
- transfer / 転移:
  同じ魂として連続性を保ったまま箱庭へ戻す扱い。
- reincarnation / 転生:
  以前の魂の痕跡だけを引き継ぎ、新しい個体として箱庭へ戻す扱い。
- heroic spirit / 英霊:
  死亡後に英霊リストへ移された存在。現役個体ではなく、記録と象徴として保持される。

## 外部へ出力するファイル構成

最小構成は次の4ファイルとする。

```text
soul-passport-bundle/
  character.passport.json
  character-soul.md
  character-visual.png
  world-context.md
```

必要に応じて、次の補助ファイルを追加できる。

```text
soul-passport-bundle/
  external-dialogue-summary.md
  return-intent.md
  heroic-spirit.md
```

### 1. `character.passport.json`

- 安定公開インターフェースとしての Character Passport。
- 後続ゲームや consumer が読む基準 JSON。
- 会話履歴そのものは入れない。
- 外部対話で増えた一時メモを直接追記しない。

### 2. `character-soul.md`

- 外部対話用の人格メモ。
- Character Passport では表しきれない、話し方、記憶要約、価値観、禁則を持つ。
- provider 固有 prompt ではなく、provider-neutral な人物ガイドとして記述する。

### 3. `character-visual.png`

- そのキャラクターを象徴する 2D ビジュアル。
- 実体画像を 1 枚持ち出す最小案とする。
- 3D モデル参照や複数差分画像は今回は扱わない。

### 4. `world-context.md`

- 外部会話時に必要な GodSandbox 世界観の最小メタ設定。
- キャラクター単体では説明しきれない神、使徒、Bless / Test / Watch の意味を持たせる。

### 5. `external-dialogue-summary.md`

- 外部対話後にユーザーが残す要約メモ。
- 会話全文を持ち帰る代わりに、箱庭へ戻す判断材料だけをまとめる。
- transfer / reincarnation の import 入力として扱う。

### 6. `return-intent.md`

- 箱庭へ戻す時のモード宣言ファイル。
- `transfer` か `reincarnation` か、どの記憶を引き継ぐか、何を捨てるかを明示する。

### 7. `heroic-spirit.md`

- 死亡キャラクターを英霊として持ち出す時のメタ情報ファイル。
- 生前の人格メモとは分け、伝承・偉業・死因・遺したものを主に記述する。

## `character-soul.md` に含める内容

`character-soul.md` は、外部 AI が「この魂として自然に話す」ための説明書である。

推奨構成:

```text
# Character Soul

## Identity
## Personality
## Speech Style
## Core Memories
## Growth History
## Blessings and Trials
## Important Events
## Relationships
## Desires and Fears
## Canon Boundaries
## Prohibitions
```

含める内容:

- 名前
- 呼ばれ方、二つ名、愛称があるならその整理
- 性格の要約
- 話し方、語尾、敬意の向け方、怒り方、迷い方
- 箱庭での主要記憶
- Bless / Test / Watch でどう変わったか
- 成長履歴
- 加護、試練、信仰、傷つきやすさ
- 重要イベントと、その解釈
- 好き嫌い、執着、恐れ
- 誰を大切にしていたか
- 外部 AI が勝手に広げすぎないための禁則
- このキャラクターが知らないこと
- 世界観の破壊や lore 断定を防ぐための boundary

含めない内容:

- provider 固有 API 設定
- system prompt の内部構造
- chain-of-thought
- ユーザーの秘密情報
- ローカルマシンの設定

## `world-context.md` に含める内容

`world-context.md` は、外部会話側で必要な最低限の世界設定だけを共有する。

推奨構成:

```text
# World Context

## What GodSandbox Is
## Who the Player Is
## What Apostles Are
## What Bless / Test / Watch Mean
## What an Event Pause Means
## Canon Tone
## Canon Boundaries
```

含める内容:

- GodSandbox は、神の視点で箱庭を観察し、重要な出来事で介入するゲームであること
- プレイヤーは、神または高位の観測者として振る舞うこと
- 使徒は案内役、通訳、観測補助の役割を持つこと
- Bless は支える介入、Test は厳しい変化を促す介入、Watch は見届ける選択であること
- イベントで時間が止まるのは、判断が必要だからであること
- 外部会話時も、この世界観を前提にすること
- 世界全体の真理を勝手に増やしすぎないこと
- キャラクター個人の記憶と、世界の公式 lore を混同しないこと

## 手動アップロード運用

本 PBI では、ChatGPT / Claude と直接 API 連携しない。

正本とする運用:

1. GodSandbox から `character.passport.json` を書き出す。
2. 同じキャラクターに対応する `character-soul.md`、`character-visual.png`、`world-context.md` を同じフォルダへ置く。
3. ユーザーが ChatGPT / Claude の project folder 相当の作業領域へこれらのファイルを手動アップロードする。
4. 外部対話では、`character-soul.md` を人格の基準、`world-context.md` を世界観の基準として使う。
5. 対話後、ユーザーは会話全文ではなく、要点だけを `external-dialogue-summary.md` に手でまとめる。
6. 箱庭へ戻すときは `return-intent.md` を追加し、transfer か reincarnation を選ぶ。

この方式の利点:

- provider 依存の API 実装が不要
- 秘密情報を repo や Passport schema に混ぜにくい
- ファイルの持ち出し範囲をユーザーが自分で確認できる

この方式の制約:

- 会話は自動同期されない
- import 時に要約メモが必要
- 外部会話の品質は、アップロードした文書の粒度に依存する

## 外部対話後に箱庭へ戻す import 方針

外部対話後の戻し方は、`転移` と `転生` を分ける。

### 転移として戻す場合

転移は「同じ魂が別の場を経て戻る」扱いにする。

特徴:

- 元キャラクターとの連続性を保つ
- 可能なら同じ `characterId` 系統で扱う
- 元の名前、人格、重要記憶を維持する
- 外部対話で得た学びは `external-dialogue-summary.md` から再解釈して反映する
- Bless / Trial の履歴は継続して参照される

転移で持ち帰る対象:

- `character.passport.json`
- `character-soul.md`
- `external-dialogue-summary.md`
- `return-intent.md`

転移で持ち帰らない対象:

- 外部会話の全文ログ
- provider ごとの hidden memory
- 外部サービス側の非公開状態

### 転生として戻す場合

転生は「前の魂の痕跡を持つ、新しい個体」として扱う。

特徴:

- 新しい個体として再観察する
- 新しい `characterId` を持つ前提にしやすい
- 前世の記憶は全文保持せず、夢、癖、口調の名残、価値観の偏りとして薄く残す
- 過去の Bless / Trial は、完全継承ではなく傾向として使う
- 名前、見た目、役割は更新されてもよい

転生で持ち帰る対象:

- `character.passport.json` のうち安定した核情報
- `character-soul.md` のうち性格傾向や価値観の断片
- `external-dialogue-summary.md` のうち、次代へ残すテーマ
- `return-intent.md` に書かれた継承範囲

転生で持ち帰らない対象:

- 完全な会話連続性
- 前世の全記憶
- 以前の個体と同一の生存履歴

## `return-intent.md` の最小項目

最小構成は次を想定する。

```text
# Return Intent

mode: transfer | reincarnation
sourceCharacterId:
sourceName:
continuitySummary:
carryOver:
doNotCarryOver:
operatorMemo:
```

`carryOver` の例:

- 話し方
- 大切にしている誓い
- 特定人物への想い
- Bless で得た前向きな傾向

`doNotCarryOver` の例:

- 会話の細部
- 一時的な怒り
- provider 依存の生成癖

## 死亡キャラクターを英霊として扱う方針

死亡したキャラクターは、現役個体一覧から外し、`英霊リスト` へ移す。

英霊リストの役割:

- 失われた個体を消さずに残す
- 後続の転生候補、召喚候補、回想対象として扱う
- 箱庭の歴史と重みを持たせる

英霊は、生者の延長ではなく「記録と象徴が濃くなった存在」として扱う。

## `heroic-spirit.md` に含めるメタ情報

推奨項目:

- 真名
- 二つ名
- 元 `characterId`
- 血統、陣営、時代があればその要約
- 生前の役割
- 死因または最期の出来事
- 代表的な Bless / Trial
- 遺した言葉
- 伝承として残る逸話
- 呼び出した時の口調
- 転生適性の有無
- 英霊としては知っているが、生前には知らなかった扱いにしない境界

英霊出力の最小ファイル構成:

```text
heroic-spirit-bundle/
  character.passport.json
  heroic-spirit.md
  character-visual.png
  world-context.md
```

## すぐ変更しない範囲

今回の設計では、次をすぐ変更しない。

- Character Passport schemaVersion
- Passport core field の追加
- Passport core への会話履歴混在
- export API
- import API
- Game UI
- 外部 provider とのオンライン同期

今回の範囲では、sidecar ファイルを増やして運用を支える。

## 後続で schema / 実装変更が必要な範囲

将来必要になりやすい項目:

- `soulId` のような魂継続識別子
- `lineageId` のような転生系統識別子
- `heroicSpiritId` のような英霊識別子
- transfer / reincarnation を扱う import manifest JSON
- export bundle の checksum や asset reference
- `deathSummary` や `legacyTitle` のような英霊向け安定 field
- return bundle を読む read model

整理方針:

- まずは Markdown sidecar で運用を試す
- 実際に戻しフローが使われ始めてから、Passport core に入れるべき項目だけを厳選する
- 会話用 metadata と公開ゲーム用 metadata を同一 schema に無理に押し込まない

## 実装 PBI への分割案

### PBI 1: `PBI-SOUL-PASSPORT-BUNDLE-EXPORT-001`

- `character.passport.json`
- `character-soul.md`
- `character-visual.png`
- `world-context.md`

をまとめて出力する bundle export 導線を実装する。

### PBI 2: `PBI-SOUL-PASSPORT-PROJECT-UPLOAD-GUIDE-001`

ChatGPT / Claude の project folder へ手動アップロードするための UI 文言、説明、テンプレ文を整備する。

### PBI 3: `PBI-SOUL-PASSPORT-RETURN-BUNDLE-001`

`external-dialogue-summary.md` と `return-intent.md` のテンプレート、および import 前提の入力形式を定義する。

### PBI 4: `PBI-SOUL-PASSPORT-TRANSFER-IMPORT-001`

transfer として戻す時の read model、連続性ルール、再観察導線を設計・実装する。

### PBI 5: `PBI-SOUL-PASSPORT-REINCARNATION-FLOW-001`

reincarnation として戻す時の継承範囲、新個体生成、前世痕跡の表現を実装する。

### PBI 6: `PBI-HEROIC-SPIRITS-ARCHIVE-001`

死亡キャラクターを英霊リストへ移し、英霊 bundle を出力できるようにする。

## 受け入れ条件に対する整理

- 外部へ持ち出すファイル構成を定義した
- API 連携なしで、手動アップロード運用を明記した
- 転移 / 転生として戻す方針を分けた
- 英霊リストと英霊出力方針を整理した
- Character Passport schema を今すぐ変えない範囲と、後続で必要な変更を分けた
- 実装 PBI に分割できる粒度まで整理した

## 今回やらないこと

- 実装
- Passport schema変更
- 画像生成
- UI変更
- 外部 API 連携
- package変更
- CI変更
- secret 保存機構
- ChatGPT / Claude 固有 SDK 対応
