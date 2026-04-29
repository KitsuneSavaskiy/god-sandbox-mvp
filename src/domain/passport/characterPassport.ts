import { createFaith, type Faith, type FaithDraft } from "./faith";
import { cloneGrowth, type CharacterGrowth } from "./growth";
import {
  getCombatClassForElement,
  type BasicAttributeSet,
  type CombatClass,
  type FivePhaseElement,
} from "./fivePhases";
import type { AbilityDefinition, SkillDefinition } from "./skill";

export const CHARACTER_PASSPORT_SCHEMA_VERSION = "character-passport/v1";
export type CharacterPassportSchemaVersion = typeof CHARACTER_PASSPORT_SCHEMA_VERSION;

export interface CharacterPassportDraft {
  characterId: string;
  name: string;
  originGame: "god-sandbox-mvp";
  element: FivePhaseElement;
  combatClass: CombatClass;
  baseAttributes: BasicAttributeSet;
  faith: FaithDraft;
  growth: CharacterGrowth;
  skills: SkillDefinition[];
  abilities: AbilityDefinition[];
}

export interface CharacterPassportV1 {
  schemaVersion: CharacterPassportSchemaVersion;
  characterId: string;
  name: string;
  originGame: "god-sandbox-mvp";
  element: FivePhaseElement;
  combatClass: CombatClass;
  baseAttributes: BasicAttributeSet;
  faith: Faith;
  growth: CharacterGrowth;
  skills: SkillDefinition[];
  abilities: AbilityDefinition[];
}

export function createCharacterPassportV1(draft: CharacterPassportDraft): CharacterPassportV1 {
  const expectedCombatClass = getCombatClassForElement(draft.element);

  if (draft.combatClass !== expectedCombatClass) {
    throw new Error(
      `Combat class mismatch for ${draft.element}: expected ${expectedCombatClass}, received ${draft.combatClass}.`,
    );
  }

  return {
    schemaVersion: CHARACTER_PASSPORT_SCHEMA_VERSION,
    characterId: draft.characterId,
    name: draft.name,
    originGame: draft.originGame,
    element: draft.element,
    combatClass: draft.combatClass,
    baseAttributes: { ...draft.baseAttributes },
    faith: createFaith(draft.faith),
    growth: cloneGrowth(draft.growth),
    skills: [...draft.skills],
    abilities: [...draft.abilities],
  };
}
