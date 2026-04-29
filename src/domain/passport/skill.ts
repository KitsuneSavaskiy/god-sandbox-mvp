import type { FivePhaseElement, StatusCondition, TacticsBuff, TacticsDebuff } from "./fivePhases";

export const ABILITY_SOURCES = ["class", "blessing", "trial", "chaos"] as const;
export type AbilitySource = (typeof ABILITY_SOURCES)[number];

export const ABILITY_TYPES = ["passive", "reaction", "aura"] as const;
export type AbilityType = (typeof ABILITY_TYPES)[number];

export const SKILL_TYPES = ["attack", "heal", "move", "support", "control"] as const;
export type SkillType = (typeof SKILL_TYPES)[number];

export const ABILITY_TRIGGER_TYPES = [
  "onTurnStart",
  "onTurnEnd",
  "onStatusReceived",
  "onAllyDamaged",
  "onFaithCommand",
  "manual",
] as const;
export type AbilityTriggerType = (typeof ABILITY_TRIGGER_TYPES)[number];

export const EFFECT_TYPES = [
  "buff",
  "debuff",
  "statusCondition",
  "heal",
  "damage",
  "move",
  "cleanse",
  "summon",
  "modifyFaith",
] as const;
export type EffectType = (typeof EFFECT_TYPES)[number];

export const EFFECT_TARGETS = ["self", "ally", "enemy", "area"] as const;
export type EffectTarget = (typeof EFFECT_TARGETS)[number];

export type AbilityTrigger =
  | { type: "onTurnStart" | "onTurnEnd" | "onAllyDamaged" | "manual" }
  | { type: "onStatusReceived"; status: StatusCondition }
  | { type: "onFaithCommand"; commandTag: string };

export type TacticsEffect =
  | { type: "buff"; key: TacticsBuff; value: number; duration: number; target: EffectTarget }
  | { type: "debuff"; key: TacticsDebuff; value: number; duration: number; target: EffectTarget }
  | { type: "statusCondition"; key: StatusCondition; duration: number; target: EffectTarget }
  | { type: "heal" | "damage" | "move"; value: number; target: EffectTarget }
  | { type: "cleanse"; target: EffectTarget; key?: StatusCondition | TacticsDebuff }
  | { type: "summon"; value: number; target: "self" | "area" }
  | { type: "modifyFaith"; value: number; target: "self" | "ally" };

export interface SkillDefinition {
  kind: "skill";
  id: string;
  name: string;
  element: FivePhaseElement;
  skillType: SkillType;
  description: string;
  targetPattern: string;
  range: number;
  powerPerTile: number;
  secondaryEffect?: TacticsEffect;
}

export interface AbilityDefinition {
  kind: "ability";
  id: string;
  name: string;
  source: AbilitySource;
  element: FivePhaseElement;
  abilityType: AbilityType;
  description: string;
  trigger: AbilityTrigger;
  effects: TacticsEffect[];
}
