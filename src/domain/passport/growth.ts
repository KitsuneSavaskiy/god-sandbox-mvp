import { createFivePhaseValues, type FivePhaseValueMap } from "./fivePhases";

export const GROWTH_CATEGORIES = ["blessings", "trials", "chaosExposure"] as const;
export type GrowthCategory = (typeof GROWTH_CATEGORIES)[number];

export type GrowthVector = FivePhaseValueMap<number>;
export type GrowthSourceTotals = Record<GrowthCategory, number>;

export interface CharacterGrowth {
  blessings: GrowthVector;
  trials: GrowthVector;
  chaosExposure: GrowthVector;
}

export function createGrowthSourceTotals(values: Partial<GrowthSourceTotals> = {}): GrowthSourceTotals {
  return {
    blessings: values.blessings ?? 0,
    trials: values.trials ?? 0,
    chaosExposure: values.chaosExposure ?? 0,
  };
}

export function createEmptyGrowth(): CharacterGrowth {
  return {
    blessings: createFivePhaseValues(),
    trials: createFivePhaseValues(),
    chaosExposure: createFivePhaseValues(),
  };
}

export function cloneGrowth(growth: CharacterGrowth): CharacterGrowth {
  return {
    blessings: createFivePhaseValues(growth.blessings),
    trials: createFivePhaseValues(growth.trials),
    chaosExposure: createFivePhaseValues(growth.chaosExposure),
  };
}
