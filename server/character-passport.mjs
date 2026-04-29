import { writeFile, readFile } from 'fs/promises';
import { join, resolve } from 'path';

import { initDirs } from './local-game-data.mjs';

const DATA_ROOT = resolve(process.cwd(), 'god-sandbox-data');
const PASSPORT_DIR = join(DATA_ROOT, 'exports', 'character-passports');

const VALID_CLASSES = new Set(['vanguard', 'mage', 'rogue', 'healer']);

function assertSafeName(name, label) {
  if (!name || typeof name !== 'string') {
    throw new Error(`Invalid ${label}: must be a non-empty string.`);
  }
  if (name.includes('/') || name.includes('\\') || name.includes('..')) {
    throw new Error(`Invalid ${label} "${name}": must not contain '/', '\\', or '..'.`);
  }
}

function assertCombatClass(combatClass) {
  if (!VALID_CLASSES.has(combatClass)) {
    throw new Error(`Invalid combatClass "${combatClass}". Expected one of: ${Array.from(VALID_CLASSES).join(', ')}`);
  }
}

export function createCharacterPassportV1(input) {
  assertSafeName(input.characterId, 'characterId');
  assertCombatClass(input.combatClass);

  return {
    schemaVersion: 'character-passport/v1',
    characterId: input.characterId,
    name: input.name,
    originGame: 'god-sandbox-mvp',
    combatClass: input.combatClass,
    faith: {
      value: input.faith.value,
      obedienceBias: input.faith.obedienceBias,
    },
    attributes: {
      hp: input.attributes.hp,
      attack: input.attributes.attack,
      defense: input.attributes.defense,
      will: input.attributes.will,
      vision: input.attributes.vision,
      stealth: input.attributes.stealth,
      support: input.attributes.support,
      chaosAffinity: input.attributes.chaosAffinity,
    },
    abilities: [...input.abilities],
    history: {
      blessings: [...input.history.blessings],
      trials: [...input.history.trials],
      chaosEvents: [...input.history.chaosEvents],
    },
  };
}

export async function writeCharacterPassportFile(passport) {
  if (passport.schemaVersion !== 'character-passport/v1') {
    throw new Error(`Unexpected schemaVersion: ${passport.schemaVersion}`);
  }
  assertSafeName(passport.characterId, 'characterId');

  await initDirs();

  const filePath = join(PASSPORT_DIR, `${passport.characterId}.character-passport.json`);
  await writeFile(filePath, JSON.stringify(passport, null, 2) + '\n', 'utf-8');

  return filePath;
}

function sampleRenPassport() {
  return createCharacterPassportV1({
    characterId: 'sample-ren',
    name: 'Ren',
    combatClass: 'rogue',
    faith: {
      value: 50,
      obedienceBias: 'cautious',
    },
    attributes: {
      hp: 8,
      attack: 3,
      defense: 2,
      will: 4,
      vision: 5,
      stealth: 3,
      support: 1,
      chaosAffinity: 2,
    },
    abilities: [],
    history: {
      blessings: [],
      trials: [],
      chaosEvents: [],
    },
  });
}

if (process.argv[2] === 'smoke') {
  console.log('passport:smoke start');

  const passport = sampleRenPassport();
  const filePath = await writeCharacterPassportFile(passport);
  const saved = JSON.parse(await readFile(filePath, 'utf-8'));

  if (saved.schemaVersion !== 'character-passport/v1') {
    throw new Error(`Unexpected schemaVersion: ${saved.schemaVersion}`);
  }

  console.log('passport file:', filePath);
  console.log('passport schema ok:', saved.schemaVersion);

  try {
    await writeCharacterPassportFile({ ...passport, characterId: '../outside' });
    console.error('FAIL: should have rejected path traversal');
    process.exit(1);
  } catch (err) {
    console.log('path traversal rejected:', err.message);
  }

  try {
    await writeCharacterPassportFile({ ...passport, characterId: 'foo/bar' });
    console.error('FAIL: should have rejected slash in characterId');
    process.exit(1);
  } catch (err) {
    console.log('slash in characterId rejected:', err.message);
  }

  console.log('passport:smoke OK');
}
