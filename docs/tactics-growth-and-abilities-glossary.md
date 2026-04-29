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
それぞれ attributes / statusAffinity / abilities にも影響する。
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
Faith, attributes, buff-oriented abilities

Trial:
Faith, statusAffinity, resilience-oriented abilities

Chaos:
Faith volatility, unusual attributes, chaos-oriented abilities
```

## Ability Categories

```text
classAbility:
職種由来の基本能力。

blessingAbility:
加護由来の能力。

trialAbility:
試練由来の能力。

chaosAbility:
カオス由来の不安定・例外的能力。
```

## Skill And Ability

```text
Skill:
能動的に使う行動。

Ability:
条件で発動する性質、パッシブ、反応、例外効果。
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
active, passive, reaction, aura

triggerTypes:
onTurnStart, onTurnEnd, onStatusReceived, onAllyDamaged, onFaithCommand, manual

effectTypes:
buff, debuff, statusCondition, heal, damage, move, cleanse, summon, modifyFaith
```

## Not Decided Yet

- 数式
- Faith の増減量
- 個別スキル一覧
- 戦闘AI
- REST API
- フロントUI
