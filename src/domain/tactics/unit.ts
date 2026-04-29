import type { Faith } from "../passport/faith";
import type { AbilityDefinition, SkillDefinition } from "../passport/skill";
import type {
  BasicAttributeSet,
  CombatClass,
  FivePhaseElement,
  StatusCondition,
  TacticsBuff,
  TacticsDebuff,
} from "../passport/fivePhases";

export const TACTICS_TEAMS = ["allies", "enemies", "neutral"] as const;
export type TacticsTeam = (typeof TACTICS_TEAMS)[number];

export interface TacticsUnitStatusBoard {
  conditions: StatusCondition[];
  buffs: Partial<Record<TacticsBuff, number>>;
  debuffs: Partial<Record<TacticsDebuff, number>>;
}

export interface TacticsUnitSnapshot {
  unitId: string;
  passportId: string;
  name: string;
  team: TacticsTeam;
  element: FivePhaseElement;
  combatClass: CombatClass;
  baseAttributes: BasicAttributeSet;
  faith: Faith;
  skills: SkillDefinition[];
  abilities: AbilityDefinition[];
  statusBoard: TacticsUnitStatusBoard;
}

export function createEmptyTacticsUnitStatusBoard(): TacticsUnitStatusBoard {
  return {
    conditions: [],
    buffs: {},
    debuffs: {},
  };
}
