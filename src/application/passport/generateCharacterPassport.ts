import type { CharacterPassportV1 } from "../../domain/passport/characterPassport";
import type { FaithDraft } from "../../domain/passport/faith";
import type { CharacterGrowth } from "../../domain/passport/growth";
import type { AbilityDefinition, SkillDefinition } from "../../domain/passport/skill";
import type { BasicAttributeSet, CombatClass, FivePhaseElement } from "../../domain/passport/fivePhases";

export interface GenerateCharacterPassportCommand {
  characterId: string;
  requestedBy: "system" | "manual";
}

export interface CharacterPassportSourceSnapshot {
  characterId: string;
  name: string;
  originGame: CharacterPassportV1["originGame"];
  element: FivePhaseElement;
  combatClass: CombatClass;
  baseAttributes: BasicAttributeSet;
  faith: FaithDraft;
  growth: CharacterGrowth;
  skills: SkillDefinition[];
  abilities: AbilityDefinition[];
}

export interface CharacterPassportSourcePort {
  loadCharacterPassportSource(command: GenerateCharacterPassportCommand): Promise<CharacterPassportSourceSnapshot | null>;
}

export interface GenerateCharacterPassportUseCase {
  execute(command: GenerateCharacterPassportCommand): Promise<CharacterPassportV1 | null>;
}
