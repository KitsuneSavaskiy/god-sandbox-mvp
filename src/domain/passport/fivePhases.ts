export const FIVE_PHASE_ELEMENTS = ["wood", "fire", "earth", "metal", "water"] as const;
export type FivePhaseElement = (typeof FIVE_PHASE_ELEMENTS)[number];

export const COMBAT_CLASSES = ["ranger", "mage", "guardian", "knight", "healer"] as const;
export type CombatClass = (typeof COMBAT_CLASSES)[number];

export const BASIC_ATTRIBUTES = ["vision", "power", "guard", "discipline", "flow"] as const;
export type BasicAttribute = (typeof BASIC_ATTRIBUTES)[number];

export const STATUS_CONDITIONS = ["rooted", "burning", "burdened", "sealed", "chilled"] as const;
export type StatusCondition = (typeof STATUS_CONDITIONS)[number];

export const BUFFS = ["growth", "ignite", "fortify", "focus", "flowing"] as const;
export type TacticsBuff = (typeof BUFFS)[number];

export const DEBUFFS = ["entangled", "overheated", "crumbled", "fractured", "displaced"] as const;
export type TacticsDebuff = (typeof DEBUFFS)[number];

export type FivePhaseValueMap<T> = Record<FivePhaseElement, T>;
export type BasicAttributeSet = Record<BasicAttribute, number>;

export function createFivePhaseValues(values: Partial<FivePhaseValueMap<number>> = {}): FivePhaseValueMap<number> {
  return {
    wood: values.wood ?? 0,
    fire: values.fire ?? 0,
    earth: values.earth ?? 0,
    metal: values.metal ?? 0,
    water: values.water ?? 0,
  };
}

export function createBaseAttributes(values: Partial<BasicAttributeSet> = {}): BasicAttributeSet {
  return {
    vision: values.vision ?? 0,
    power: values.power ?? 0,
    guard: values.guard ?? 0,
    discipline: values.discipline ?? 0,
    flow: values.flow ?? 0,
  };
}
