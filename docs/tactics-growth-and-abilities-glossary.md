# Growth And Abilities Glossary

This document fixes the vocabulary for Blessing, Trial, Chaos, growth, and abilities before Character Passport v1 grows beyond its current minimal schema.

It is a design glossary, not an implementation. It does not define formulas, runtime behavior, REST APIs, or frontend UI.

## Purpose

- Treat Blessing, Trial, and Chaos as sources of growth, resistance, and special abilities, not only as Faith inputs.
- Fix the meaning of `growth` and `abilities` before Character Passport v1 implementation expands.
- Give future tactics-game developers a shared language for interpreting character export data.

## Blessing / Trial / Chaos

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

## Relationship To Faith

```text
Blessing / Trial / Chaos は Faith に影響するが、Faith だけの材料ではない。
影響先は growth category ごとに異なる。
```

## growth Structure

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

## Growth Influence Targets

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

## Ability Categories

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

JSON keys:

```text
Human label -> JSON key

Class Ability -> class
Blessing Ability -> blessing
Trial Ability -> trial
Chaos Ability -> chaos
```

## Skill And Ability

```text
Skill:
能動的に選択して使う行動。
例: 攻撃、回復、移動技、範囲魔法。

Ability:
条件で発動する性質、パッシブ、反応、オーラ。
例: 被弾時に発動、状態異常時に発動、周囲に常時効果。
```

Character Passport storage rule:

```text
Character Passport v1 では、能動行動は `skills` に保存する。
条件発動・常時効果・反応効果は `abilities` に保存する。
```

## ability Schema Draft

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

## Canonical Keys

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

## Character Passport Reflection

```text
Character Passport v1 should keep:
- skills: active actions
- abilities: passive / reaction / aura effects
```

## Not Decided Yet

- 数式
- Faith の増減量
- 個別スキル一覧
- 戦闘AI
- REST API
- フロントUI
