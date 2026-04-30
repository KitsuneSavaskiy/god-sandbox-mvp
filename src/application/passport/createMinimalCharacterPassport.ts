import type { Character } from "../../domain/types";

export const MINIMAL_CHARACTER_PASSPORT_SCHEMA_VERSION = "character-passport/minimal-v1";

export interface MinimalCharacterPassport {
  schemaVersion: typeof MINIMAL_CHARACTER_PASSPORT_SCHEMA_VERSION;
  characterId: string;
  displayName: string;
  name: string;
  summary: string;
  portraitImage: string | null;
  tags: string[];
}

const ROLE_TAGS: Record<Character["role"], string> = {
  Vanguard: "前に立つ",
  Artillery: "遠くを見通す",
  Support: "支える",
};

const ELEMENT_TAGS: Record<Character["element"], string> = {
  Wood: "wood属性",
  Fire: "fire属性",
  Earth: "earth属性",
  Metal: "metal属性",
  Water: "water属性",
};

const YIN_YANG_TAGS: Record<Character["yinYang"], string> = {
  Yin: "静かな気質",
  Balanced: "ほどよい気質",
  Yang: "前向きな気質",
};

function createSummary(character: Character) {
  const latestNotable = character.notable[character.notable.length - 1];
  const lifeLine = character.alive
    ? `${character.name} は ${character.bloodlineName} に連なる、まだ箱庭で歩み続けているキャラクターです。`
    : `${character.name} は ${character.bloodlineName} に連なる、記録として残されたキャラクターです。`;

  if (!latestNotable) {
    return lifeLine;
  }

  return `${lifeLine} 最近の記録: ${latestNotable}`;
}

function createTags(character: Character) {
  const tags = [
    character.bloodlineName,
    ROLE_TAGS[character.role],
    ELEMENT_TAGS[character.element],
    YIN_YANG_TAGS[character.yinYang],
    character.alive ? "生存中" : "記録のみ",
  ];

  if (character.favorite) {
    tags.push("注目株");
  }

  if (character.notable.length > 0) {
    tags.push("観察メモあり");
  }

  return tags;
}

export function createMinimalCharacterPassport(character: Character): MinimalCharacterPassport {
  return {
    schemaVersion: MINIMAL_CHARACTER_PASSPORT_SCHEMA_VERSION,
    characterId: character.id,
    displayName: character.name,
    name: character.name,
    summary: createSummary(character),
    portraitImage: null,
    tags: createTags(character),
  };
}

export function formatMinimalCharacterPassport(passport: MinimalCharacterPassport) {
  return JSON.stringify(passport, null, 2);
}
