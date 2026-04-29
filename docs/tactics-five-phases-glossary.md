# 五行タクティクス用語辞書

この資料は、Character Passport v1 と将来の五行ベースのタクティクス戦闘ゲームに向けて、用語の意味を固定するための辞書です。

これは設計辞書であり、実装ではありません。実行時挙動、戦闘式、API、永続化ルールはここでは定義しません。

## この資料の目的

- 五行タクティクス用語の解釈を開発者間で揃える。
- 戦闘コードが存在する前に、Character Passport v1 の各項目を読める状態にする。
- 用語の決定と、将来の実装詳細を分離する。

## 五行と職種

この資料では、木（wood）、火（fire）、土（earth）、金（metal）、水（water）を五行（element）として扱います。
MVP では、職種（combatClass）と五行は 1:1 で対応します。

```text
wood  = ranger
fire  = mage
earth = guardian
metal = knight
water = healer
```

MVP でのルール:

```text
MVPでは element と combatClass は 1:1 固定。
将来は分離可能だが、v1では分離しない。
```

## 五行の代表機能

```text
wood:
展開・探索・成長

fire:
意志・熱・火力

earth:
支援・変換・安定

metal:
境界・規律・制約

water:
根源・回復・継承
```

## 職種定義

```text
Ranger:
木。視野、索敵、罠、成長、展開を担う。

Mage:
火。遠距離火力、範囲攻撃、士気、熱量を担う。

Guardian:
土。防御、陣地、補給、安定を担う。

Knight:
金。突撃前衛ではなく、境界を守り、規律で行動を制限する境界制御役。

Healer:
水。単なるHP回復役ではなく、浄化、復元、位置調整、継承を担う。
```

## 基本ステータス

```text
Vision:
木。視野、索敵、罠発見、反応範囲。

Power:
火。与ダメージ、火力系状態異常の強度。

Guard:
土。被ダメージ軽減、ノックバック耐性、陣地維持。

Discipline:
金。命中、封印成功率、制約効果、貫通。

Flow:
水。回復量、状態解除、位置調整、行動順補正。
回避まではMVPでは含めない。
```

## 状態異常とデバフの区別

```text
Status condition:
行動そのものに直接影響する一時状態。

Debuff:
数値・盤面性能・命中・防御などを下げる性能低下。
```

代表例:

```text
Rooted:
状態異常。移動を直接制限する。

Entangled:
デバフ。視界、経路、罠回避などの盤面対応力を下げる。
```

## 状態異常

```text
wood  = Rooted
fire  = Burning
earth = Burdened
metal = Sealed
water = Chilled
```

`Chilled` は水の状態異常です。主効果は **行動順低下** に固定します。
火力低下や移動低下を後から入れる場合は、副効果として扱います。

## バフ

```text
wood  = Growth
fire  = Ignite
earth = Fortify
metal = Focus
water = Flowing
```

## デバフ

```text
wood  = Entangled
fire  = Overheated
earth = Crumbled
metal = Fractured
water = Displaced
```

`Displaced` は **位置ずれ・配置不利** を主効果にします。
命中低下や行動順低下とは混ぜません。

## 状態異常適性（statusAffinity）

```text
statusAffinity は、状態異常の「付与されやすさ / 抵抗しやすさ」を表す。
ダメージ耐性ではない。
持続時間補正でもない。

値:
-2 = とても付与されやすい
-1 = 付与されやすい
 0 = 標準
+1 = 抵抗しやすい
+2 = とても抵抗しやすい
```

## 信仰度（Faith）

```text
Faith は五行とは別軸。
神がリアルタイムにチャットで出す指示を、キャラクターがどう受け取り、どの程度従うかを表す。
単なる命令成功率ではない。
命令解釈、危険命令への反応、自律判断とのせめぎ合いを含む。
```

信仰度の値（Faith value）:

```text
0-20:
神の指示をほとんど信用しない

21-40:
疑いながら受け取る

41-60:
通常程度に従う

61-80:
積極的に従う

81-100:
強く信頼し、危険な命令にも従いやすい
```

服従傾向（obedienceBias）:

```text
cautious:
慎重に解釈する

fervent:
熱狂的に従う

stable:
安定して従う

disciplined:
規律として正確に従う

adaptive:
状況に合わせて柔軟に従う
```

信仰度の由来（Faith.source）:

```text
blessings:
神から肯定的な介入を受けた履歴量

trials:
神から試練・負荷を受けた履歴量

chaosExposure:
カオス兆候や不安定な世界状況に晒された履歴量
```

## 相生 / 相剋

数値倍率はまだ決めません。
MVP では効果カテゴリだけを定義します。

相生:

```text
wood -> fire:
Ranger の索敵・拘束が Mage の火力を通しやすくする

fire -> earth:
Mage の炎や士気上昇が Guardian の陣地形成につながる

earth -> metal:
Guardian の陣地内で Knight の命中・制約が通りやすくなる

metal -> water:
Knight の制約により Healer の浄化・復元が通りやすくなる

water -> wood:
Healer の浄化・復元で Ranger の視野・機動が伸びる
```

相剋:

```text
wood -> earth:
Ranger が Guardian の陣地や防壁を崩す

earth -> water:
Guardian が Healer の位置操作や流動効果を止める

water -> fire:
Healer が Mage の燃焼や火力上昇を冷却する

fire -> metal:
Mage が Knight の装甲や規律を溶かす

metal -> wood:
Knight が Ranger の拘束・罠・蔦を切断する
```

## attack pattern 方針

```text
技は以下で制御する:
- target pattern
- range
- power per tile
- secondary effect
```

五行ごとの範囲傾向:

```text
wood:
枝分かれ、斜め、罠、視野範囲

fire:
扇形、直線、爆心地中心の範囲

earth:
自分周囲、味方周囲、陣地、壁

metal:
前方1〜3マス、単体、貫通直線

water:
位置操作、押し流し、全体弱効果、指定位置操作
```

## canonical key 一覧

```text
elements:
wood, fire, earth, metal, water

combatClass:
ranger, mage, guardian, knight, healer

attributes:
vision, power, guard, discipline, flow

statusConditions:
rooted, burning, burdened, sealed, chilled

buffs:
growth, ignite, fortify, focus, flowing

debuffs:
entangled, overheated, crumbled, fractured, displaced

obedienceBias:
cautious, fervent, stable, disciplined, adaptive
```
