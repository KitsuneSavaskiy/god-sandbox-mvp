# 成長と特殊能力の用語辞書

この資料は、Character Passport v1 が現在の最小スキーマから拡張される前に、加護（Blessing）、試練（Trial）、カオス（Chaos）、成長（growth）、特殊能力（abilities）の意味を固定するための用語辞書です。

これは設計辞書であり、実装ではありません。数式、実行時挙動、REST API、フロントエンド UI は定義しません。

## この資料の目的

- 加護 / 試練 / カオスを、信仰度（Faith）だけでなく、成長・耐性・特殊能力の源泉として扱う。
- Character Passport v1 の実装が拡張される前に、`growth` と `abilities` の意味を固定する。
- 将来のタクティクスゲーム開発者が、キャラクター export データを同じ意味で読めるようにする。

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

## 今回まだ決めないもの

- 数式
- Faith の増減量
- 個別スキル一覧
- 戦闘AI
- REST API
- フロントUI
