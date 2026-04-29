import { writeFile, mkdir, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const DATA_ROOT = resolve(process.cwd(), 'god-sandbox-data');
const EXPORTS_DIR = join(DATA_ROOT, 'exports', 'character-passports');

export function buildPassport({ characterId, name, combatClass, faith, attributes, abilities = [], history = {} }) {
  return {
    schemaVersion: 'character-passport/v1',
    characterId,
    name,
    originGame: 'god-sandbox-mvp',
    combatClass,
    faith,
    attributes,
    abilities,
    history: {
      blessings: [],
      trials: [],
      chaosEvents: [],
      ...history,
    },
  };
}

export async function exportPassport(passport) {
  await mkdir(EXPORTS_DIR, { recursive: true });
  const filePath = join(EXPORTS_DIR, `${passport.characterId}.character-passport.json`);
  await writeFile(filePath, JSON.stringify(passport, null, 2) + '\n', 'utf-8');
  return filePath;
}

const SAMPLE_REN = {
  characterId: 'sample-ren',
  name: 'Ren',
  combatClass: 'rogue',
  faith: { value: 50, obedienceBias: 'cautious' },
  attributes: { hp: 8, attack: 3, defense: 2, will: 4, vision: 5, stealth: 3, support: 1, chaosAffinity: 2 },
  abilities: [],
  history: { blessings: [], trials: [], chaosEvents: [] },
};

// Smoke test — node server/character-passport.mjs smoke
const __filename = fileURLToPath(import.meta.url);
const isMain = Boolean(process.argv[1]) && resolve(process.argv[1]) === __filename;

if (isMain && process.argv[2] === 'smoke') {
  console.log('passport:smoke start');

  const passport = buildPassport(SAMPLE_REN);
  const outPath = await exportPassport(passport);
  console.log('exported:', outPath);

  const parsed = JSON.parse(await readFile(outPath, 'utf-8'));

  if (parsed.schemaVersion !== 'character-passport/v1') {
    console.error('FAIL: schemaVersion mismatch:', parsed.schemaVersion);
    process.exit(1);
  }
  if (parsed.characterId !== 'sample-ren') {
    console.error('FAIL: characterId mismatch:', parsed.characterId);
    process.exit(1);
  }
  if (parsed.originGame !== 'god-sandbox-mvp') {
    console.error('FAIL: originGame mismatch:', parsed.originGame);
    process.exit(1);
  }
  if (!['vanguard', 'mage', 'rogue', 'healer'].includes(parsed.combatClass)) {
    console.error('FAIL: invalid combatClass:', parsed.combatClass);
    process.exit(1);
  }

  console.log('schema ok:', parsed.schemaVersion);
  console.log('character ok:', parsed.name, '/', parsed.combatClass);
  console.log('faith ok:', JSON.stringify(parsed.faith));
  console.log('attributes ok:', Object.keys(parsed.attributes).join(', '));
  console.log('passport:smoke OK');
}
