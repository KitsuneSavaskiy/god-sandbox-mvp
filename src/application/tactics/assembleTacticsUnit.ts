import type { CharacterPassportV1 } from "../../domain/passport/characterPassport";
import type { TacticsTeam, TacticsUnitSnapshot } from "../../domain/tactics/unit";

export interface AssembleTacticsUnitCommand {
  unitId: string;
  team: TacticsTeam;
  passport: CharacterPassportV1;
}

export interface TacticsPassportReaderPort {
  loadPassport(characterId: string): Promise<CharacterPassportV1 | null>;
}

export interface AssembleTacticsUnitUseCase {
  execute(command: AssembleTacticsUnitCommand): TacticsUnitSnapshot;
}
