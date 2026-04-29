export const FIVE_PHASE_ELEMENTS = ["wood", "fire", "earth", "metal", "water"] as const;
export type FivePhaseElement = (typeof FIVE_PHASE_ELEMENTS)[number];

export const COMBAT_CLASSES = ["ranger", "mage", "guardian", "knight", "healer"] as const;
export type CombatClass = (typeof COMBAT_CLASSES)[number];

export const COMBAT_CLASS_BY_ELEMENT = {
  wood: "ranger",
  fire: "mage",
  earth: "guardian",
  metal: "knight",
  water: "healer",
} as const satisfies Record<FivePhaseElement, CombatClass>;

export const ELEMENT_BY_COMBAT_CLASS = {
  ranger: "wood",
  mage: "fire",
  guardian: "earth",
  knight: "metal",
  healer: "water",
} as const satisfies Record<CombatClass, FivePhaseElement>;

export const BASIC_ATTRIBUTES = ["vision", "power", "guard", "discipline", "flow"] as const;
export type BasicAttribute = (typeof BASIC_ATTRIBUTES)[number];

export const BASIC_ATTRIBUTE_BY_ELEMENT = {
  wood: "vision",
  fire: "power",
  earth: "guard",
  metal: "discipline",
  water: "flow",
} as const satisfies Record<FivePhaseElement, BasicAttribute>;

export const STATUS_CONDITIONS = ["rooted", "burning", "burdened", "sealed", "chilled"] as const;
export type StatusCondition = (typeof STATUS_CONDITIONS)[number];

export const STATUS_CONDITION_BY_ELEMENT = {
  wood: "rooted",
  fire: "burning",
  earth: "burdened",
  metal: "sealed",
  water: "chilled",
} as const satisfies Record<FivePhaseElement, StatusCondition>;

export const BUFFS = ["growth", "ignite", "fortify", "focus", "flowing"] as const;
export type TacticsBuff = (typeof BUFFS)[number];

export const BUFF_BY_ELEMENT = {
  wood: "growth",
  fire: "ignite",
  earth: "fortify",
  metal: "focus",
  water: "flowing",
} as const satisfies Record<FivePhaseElement, TacticsBuff>;

export const DEBUFFS = ["entangled", "overheated", "crumbled", "fractured", "displaced"] as const;
export type TacticsDebuff = (typeof DEBUFFS)[number];

export const DEBUFF_BY_ELEMENT = {
  wood: "entangled",
  fire: "overheated",
  earth: "crumbled",
  metal: "fractured",
  water: "displaced",
} as const satisfies Record<FivePhaseElement, TacticsDebuff>;

export type FivePhaseValueMap<T> = Record<FivePhaseElement, T>;
export type BasicAttributeSet = Record<BasicAttribute, number>;

export function getCombatClassForElement(element: FivePhaseElement): CombatClass {
  return COMBAT_CLASS_BY_ELEMENT[element];
}

export function getElementForCombatClass(combatClass: CombatClass): FivePhaseElement {
  return ELEMENT_BY_COMBAT_CLASS[combatClass];
}

export function getBasicAttributeForElement(element: FivePhaseElement): BasicAttribute {
  return BASIC_ATTRIBUTE_BY_ELEMENT[element];
}

export function getStatusConditionForElement(element: FivePhaseElement): StatusCondition {
  return STATUS_CONDITION_BY_ELEMENT[element];
}

export function getBuffForElement(element: FivePhaseElement): TacticsBuff {
  return BUFF_BY_ELEMENT[element];
}

export function getDebuffForElement(element: FivePhaseElement): TacticsDebuff {
  return DEBUFF_BY_ELEMENT[element];
}

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
