import { createGrowthSourceTotals, type GrowthSourceTotals } from "./growth";

export const FAITH_OBEDIENCE_BIASES = [
  "cautious",
  "fervent",
  "stable",
  "disciplined",
  "adaptive",
] as const;
export type FaithObedienceBias = (typeof FAITH_OBEDIENCE_BIASES)[number];

export const FAITH_COMMAND_INTERPRETATIONS = ["skeptical", "measured", "literal", "contextual"] as const;
export type FaithCommandInterpretation = (typeof FAITH_COMMAND_INTERPRETATIONS)[number];

export const FAITH_HAZARD_RESPONSES = ["avoidant", "guarded", "resolute"] as const;
export type FaithHazardResponse = (typeof FAITH_HAZARD_RESPONSES)[number];

export const FAITH_AUTONOMY_ALIGNMENTS = ["selfDirected", "balanced", "deferential"] as const;
export type FaithAutonomyAlignment = (typeof FAITH_AUTONOMY_ALIGNMENTS)[number];

export const FAITH_TRUST_BANDS = ["dismissive", "wary", "steady", "trusting", "devoted"] as const;
export type FaithTrustBand = (typeof FAITH_TRUST_BANDS)[number];

export interface FaithDraft {
  value: number;
  obedienceBias: FaithObedienceBias;
  commandInterpretation: FaithCommandInterpretation;
  hazardResponse: FaithHazardResponse;
  autonomyAlignment: FaithAutonomyAlignment;
  sources: GrowthSourceTotals;
}

export interface Faith extends FaithDraft {
  trustBand: FaithTrustBand;
}

export function clampFaithValue(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getFaithTrustBand(value: number): FaithTrustBand {
  const normalized = clampFaithValue(value);

  if (normalized <= 20) {
    return "dismissive";
  }

  if (normalized <= 40) {
    return "wary";
  }

  if (normalized <= 60) {
    return "steady";
  }

  if (normalized <= 80) {
    return "trusting";
  }

  return "devoted";
}

export function createFaith(draft: FaithDraft): Faith {
  const value = clampFaithValue(draft.value);

  return {
    ...draft,
    value,
    trustBand: getFaithTrustBand(value),
    sources: createGrowthSourceTotals(draft.sources),
  };
}
