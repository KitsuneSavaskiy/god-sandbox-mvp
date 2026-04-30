# 成長と特殊能力の用語辞書

## 現在の位置づけ

この資料は、加護（Blessing）、試練（Trial）、カオス（Chaos）、成長（growth）、特殊能力（abilities）を整理した旧設計を含む用語辞書です。
五行別の `growth` 構造や、能力の `element` を前提にした例は、legacy / historical concept を含む GodSandbox world preset として扱います。

現行の Character Passport core contract では、属性（`element`）は有限パラメータの1つであり、Skill、Ability、成長、職種を支配しません。
後続ゲームは、この資料の五行presetを採用してもよいですが、採用しなくても構いません。
後続ゲームは、受け取った属性や職種、Skill、Ability の意味を自分のゲーム内で自由に再解釈できます。

これは設計辞書であり、実装ではありません。数式、実行時挙動、REST API、フロントエンド UI は定義しません。

## この資料の目的

- 加護 / 試練 / カオスを、信仰度（Faith）だけでなく、成長・耐性・特殊能力の源泉として扱う。
- legacy / GodSandbox world preset における `growth` と `abilities` の意味を保存する。
- 旧設計が現行 Passport core contract と誤読されないように境界を明示する。
- 将来のタクティクスゲーム開発者が、必要な部分だけを読み、不要な部分をスキップできるようにする。

## 加護 / 試練 / カオス

```text
Blessing:
神から与えられた肯定的な介入。
安定した成長、Faith上昇、バフ系能力の源泉。

Trial:
神または世界から与えられた困難。
耐性、逆境能力、Faith変動の源泉。

Chaos:
世界の不安定さに触れた経験。
尖った成長、例外能力、Faith解釈の揺らぎの源泉。
```

## 信仰度（Faith）との関係

```text
加護 / 試練 / カオスは信仰度（Faith）に影響するが、Faith だけの材料ではない。
影響先は成長カテゴリ（growth category）ごとに異なる。
```

## 成長（growth）構造案

以下は legacy / GodSandbox world preset の構造案です。
現行 Character Passport core contract で、成長が必ず五行別ベクトルであることを要求するものではありません。

```json
{
  "growth": {
    "blessings": {
      "wood": 0,
      "fire": 0,
      "earth": 0,
      "metal": 0,
      "water": 0
    },
    "trials": {
      "wood": 0,
      "fire": 0,
      "earth": 0,
      "metal": 0,
      "water": 0
    },
    "chaosExposure": {
      "wood": 0,
      "fire": 0,
      "earth": 0,
      "metal": 0,
      "water": 0
    }
  }
}
```

## 成長要素の影響先

以下は GodSandbox world preset 内での成長解釈です。
現行 Character Passport core contract では、属性や成長カテゴリが他パラメータを支配する仕様ではありません。

```text
Blessing:
- Faith に影響する
- Attributes に影響する
- Abilities に影響する
- StatusAffinity には原則直接影響しない
- 意味: 安定成長・加護能力

Trial:
- Faith に影響する
- Attributes に影響する
- StatusAffinity に影響する
- Abilities に影響する
- 意味: 苦難による成長・耐性・逆境能力

Chaos:
- Faith に影響する
- Attributes に影響する
- StatusAffinity に影響する
- Abilities に影響する
- 意味: 不安定な変質・例外能力
```

## 特殊能力の分類

```text
Class Ability:
職種由来の基本能力。

Blessing Ability:
加護由来の能力。

Trial Ability:
試練由来の能力。

Chaos Ability:
カオス由来の不安定・例外的能力。
```

JSON key 対応:

```text
人間向けラベル -> JSON key

Class Ability -> class
Blessing Ability -> blessing
Trial Ability -> trial
Chaos Ability -> chaos
```

## 技（Skill）と特殊能力（Ability）の境界

```text
Skill:
能動的に選択して使う行動。
例: 攻撃、回復、移動技、範囲魔法。

Ability:
条件で発動する性質、パッシブ、反応、オーラ。
例: 被弾時に発動、状態異常時に発動、周囲に常時効果。
```

Character Passport での保存先:

```text
Character Passport v1 では、能動行動は `skills` に保存する。
条件発動・常時効果・反応効果は `abilities` に保存する。
```

## ability schema 案

以下は GodSandbox world preset で能力を表現する場合の案です。
`element` は能力を分類するための任意の属性値であり、Character Passport core contract 全体で能力の効果や職種を支配するものではありません。

```json
{
  "id": "iron-vow",
  "name": "Iron Vow",
  "source": "trial",
  "element": "metal",
  "type": "passive",
  "description": "When restricted, this character converts restraint into discipline.",
  "trigger": {
    "type": "onStatusReceived",
    "status": "sealed"
  },
  "effects": [
    {
      "type": "buff",
      "key": "focus",
      "value": 1,
      "duration": 1
    }
  ]
}
```

## canonical key 一覧

```text
growthCategories:
blessings, trials, chaosExposure

abilitySources:
class, blessing, trial, chaos

abilityTypes:
passive, reaction, aura

skillTypes:
attack, heal, move, support, control

triggerTypes:
onTurnStart, onTurnEnd, onStatusReceived, onAllyDamaged, onFaithCommand, manual

effectTypes:
buff, debuff, statusCondition, heal, damage, move, cleanse, summon, modifyFaith
```

## Character Passport への反映方針

```text
Character Passport v1 は次の保存先を維持する:
- skills: 能動行動
- abilities: passive / reaction / aura 効果
```

この分離は stable interface として維持します。
ただし、この資料内の五行別成長や element 付き能力例は GodSandbox world preset の旧設計であり、すべての後続ゲームに採用を要求するものではありません。

## 今回まだ決めないもの

- 数式
- Faith の増減量
- 個別スキル一覧
- 戦闘AI
- REST API
- フロントUI
