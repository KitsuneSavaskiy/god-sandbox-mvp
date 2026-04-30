import { readFile, writeFile } from 'fs/promises';
import { join, resolve } from 'path';

import { initDirs } from './local-game-data.mjs';

const DATA_ROOT = resolve(process.cwd(), 'god-sandbox-data');
const PASSPORT_DIR = join(DATA_ROOT, 'exports', 'character-passports');
export const PASSPORT_EXPORT_CONTRACT = Object.freeze({
  schemaVersion: 'character-passport/v1',
  fivePhaseElements: ['wood', 'fire', 'earth', 'metal', 'water'],
  combatClasses: ['ranger', 'mage', 'guardian', 'knight', 'healer'],
  baseAttributes: ['vision', 'power', 'guard', 'discipline', 'flow'],
  faithObedienceBiases: ['cautious', 'fervent', 'stable', 'disciplined', 'adaptive'],
  faithCommandInterpretations: ['skeptical', 'measured', 'literal', 'contextual'],
  faithHazardResponses: ['avoidant', 'guarded', 'resolute'],
  faithAutonomyAlignments: ['selfDirected', 'balanced', 'deferential'],
  faithTrustBands: ['dismissive', 'wary', 'steady', 'trusting', 'devoted'],
  growthCategories: ['blessings', 'trials', 'chaosExposure'],
});

const VALID_ELEMENTS = new Set(PASSPORT_EXPORT_CONTRACT.fivePhaseElements);
const VALID_CLASSES = new Set(PASSPORT_EXPORT_CONTRACT.combatClasses);
const VALID_OBEDIENCE_BIASES = new Set(PASSPORT_EXPORT_CONTRACT.faithObedienceBiases);
const VALID_COMMAND_INTERPRETATIONS = new Set(PASSPORT_EXPORT_CONTRACT.faithCommandInterpretations);
const VALID_HAZARD_RESPONSES = new Set(PASSPORT_EXPORT_CONTRACT.faithHazardResponses);
const VALID_AUTONOMY_ALIGNMENTS = new Set(PASSPORT_EXPORT_CONTRACT.faithAutonomyAlignments);

function assertSafeName(name, label) {
  if (!name || typeof name !== 'string') {
    throw new Error(`Invalid ${label}: must be a non-empty string.`);
  }
  if (name.includes('/') || name.includes('\\') || name.includes('..')) {
    throw new Error(`Invalid ${label} "${name}": must not contain '/', '\\', or '..'.`);
  }
}

function assertNonEmptyString(value, label) {
  if (!value || typeof value !== 'string') {
    throw new Error(`Invalid ${label}: must be a non-empty string.`);
  }
}

function assertFiniteNumber(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid ${label}: must be a finite number.`);
  }
}

function assertPlainObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid ${label}: must be an object.`);
  }
}

function assertArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid ${label}: must be an array.`);
  }
}

function assertEnum(value, set, label) {
  if (!set.has(value)) {
    throw new Error(`Invalid ${label} "${value}". Expected one of: ${Array.from(set).join(', ')}`);
  }
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function clampFaithValue(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getFaithTrustBand(value) {
  if (value <= 20) {
    return 'dismissive';
  }

  if (value <= 40) {
    return 'wary';
  }

  if (value <= 60) {
    return 'steady';
  }

  if (value <= 80) {
    return 'trusting';
  }

  return 'devoted';
}

function assertFivePhaseValueMap(record, label) {
  assertPlainObject(record, label);

  for (const key of PASSPORT_EXPORT_CONTRACT.fivePhaseElements) {
    assertFiniteNumber(record[key], `${label}.${key}`);
  }
}

function normalizeBaseAttributes(baseAttributes) {
  assertPlainObject(baseAttributes, 'baseAttributes');

  for (const key of PASSPORT_EXPORT_CONTRACT.baseAttributes) {
    assertFiniteNumber(baseAttributes[key], `baseAttributes.${key}`);
  }

  return {
    vision: baseAttributes.vision,
    power: baseAttributes.power,
    guard: baseAttributes.guard,
    discipline: baseAttributes.discipline,
    flow: baseAttributes.flow,
  };
}

function normalizeFaith(faith) {
  assertPlainObject(faith, 'faith');
  assertFiniteNumber(faith.value, 'faith.value');
  assertEnum(faith.obedienceBias, VALID_OBEDIENCE_BIASES, 'faith.obedienceBias');
  assertEnum(faith.commandInterpretation, VALID_COMMAND_INTERPRETATIONS, 'faith.commandInterpretation');
  assertEnum(faith.hazardResponse, VALID_HAZARD_RESPONSES, 'faith.hazardResponse');
  assertEnum(faith.autonomyAlignment, VALID_AUTONOMY_ALIGNMENTS, 'faith.autonomyAlignment');
  assertPlainObject(faith.sources, 'faith.sources');
  assertFiniteNumber(faith.sources.blessings, 'faith.sources.blessings');
  assertFiniteNumber(faith.sources.trials, 'faith.sources.trials');
  assertFiniteNumber(faith.sources.chaosExposure, 'faith.sources.chaosExposure');

  const value = clampFaithValue(faith.value);

  return {
    value,
    obedienceBias: faith.obedienceBias,
    commandInterpretation: faith.commandInterpretation,
    hazardResponse: faith.hazardResponse,
    autonomyAlignment: faith.autonomyAlignment,
    trustBand: getFaithTrustBand(value),
    sources: {
      blessings: faith.sources.blessings,
      trials: faith.sources.trials,
      chaosExposure: faith.sources.chaosExposure,
    },
  };
}

function normalizeGrowth(growth) {
  assertPlainObject(growth, 'growth');
  assertFivePhaseValueMap(growth.blessings, 'growth.blessings');
  assertFivePhaseValueMap(growth.trials, 'growth.trials');
  assertFivePhaseValueMap(growth.chaosExposure, 'growth.chaosExposure');

  return {
    blessings: cloneJson(growth.blessings),
    trials: cloneJson(growth.trials),
    chaosExposure: cloneJson(growth.chaosExposure),
  };
}

function normalizeSkills(skills) {
  assertArray(skills, 'skills');

  return skills.map((skill, index) => {
    assertPlainObject(skill, `skills[${index}]`);
    assertNonEmptyString(skill.id, `skills[${index}].id`);
    assertNonEmptyString(skill.name, `skills[${index}].name`);
    assertEnum(skill.kind, new Set(['skill']), `skills[${index}].kind`);
    assertEnum(skill.element, VALID_ELEMENTS, `skills[${index}].element`);

    return cloneJson(skill);
  });
}

function normalizeAbilities(abilities) {
  assertArray(abilities, 'abilities');

  return abilities.map((ability, index) => {
    assertPlainObject(ability, `abilities[${index}]`);
    assertNonEmptyString(ability.id, `abilities[${index}].id`);
    assertNonEmptyString(ability.name, `abilities[${index}].name`);
    assertEnum(ability.kind, new Set(['ability']), `abilities[${index}].kind`);
    assertEnum(ability.element, VALID_ELEMENTS, `abilities[${index}].element`);

    return cloneJson(ability);
  });
}

export function createCharacterPassportV1(input) {
  assertSafeName(input.characterId, 'characterId');
  assertNonEmptyString(input.name, 'name');
  if (input.originGame && input.originGame !== 'god-sandbox-mvp') {
    throw new Error(`Invalid originGame "${input.originGame}". Expected god-sandbox-mvp.`);
  }
  assertEnum(input.element, VALID_ELEMENTS, 'element');
  assertEnum(input.combatClass, VALID_CLASSES, 'combatClass');

  return {
    schemaVersion: PASSPORT_EXPORT_CONTRACT.schemaVersion,
    characterId: input.characterId,
    name: input.name,
    originGame: 'god-sandbox-mvp',
    element: input.element,
    combatClass: input.combatClass,
    baseAttributes: normalizeBaseAttributes(input.baseAttributes),
    faith: normalizeFaith(input.faith),
    growth: normalizeGrowth(input.growth),
    skills: normalizeSkills(input.skills),
    abilities: normalizeAbilities(input.abilities),
  };
}

// server 側は Domain / Application の意味を前提に、export 契約と file write を吸収する。
export function adaptCharacterPassportSourceToExport(source) {
  return createCharacterPassportV1(source);
}

export async function writeCharacterPassportFile(passport) {
  if (passport.schemaVersion !== PASSPORT_EXPORT_CONTRACT.schemaVersion) {
    throw new Error(`Unexpected schemaVersion: ${passport.schemaVersion}`);
  }
  assertSafeName(passport.characterId, 'characterId');

  await initDirs();

  const filePath = join(PASSPORT_DIR, `${passport.characterId}.character-passport.json`);
  await writeFile(filePath, JSON.stringify(passport, null, 2) + '\n', 'utf-8');

  return filePath;
}

function emptyFivePhaseValues(overrides = {}) {
  return {
    wood: overrides.wood ?? 0,
    fire: overrides.fire ?? 0,
    earth: overrides.earth ?? 0,
    metal: overrides.metal ?? 0,
    water: overrides.water ?? 0,
  };
}

function sampleRenPassportSource() {
  return {
    characterId: 'sample-ren',
    name: 'Ren',
    originGame: 'god-sandbox-mvp',
    element: 'metal',
    combatClass: 'mage',
    baseAttributes: {
      vision: 2,
      power: 3,
      guard: 5,
      discipline: 6,
      flow: 2,
    },
    faith: {
      value: 50,
      obedienceBias: 'cautious',
      commandInterpretation: 'measured',
      hazardResponse: 'guarded',
      autonomyAlignment: 'balanced',
      sources: {
        blessings: 1,
        trials: 2,
        chaosExposure: 0,
      },
    },
    growth: {
      blessings: emptyFivePhaseValues({ metal: 1 }),
      trials: emptyFivePhaseValues({ metal: 2, earth: 1 }),
      chaosExposure: emptyFivePhaseValues(),
    },
    skills: [
      {
        kind: 'skill',
        id: 'iron-lunge',
        name: 'Iron Lunge',
        element: 'metal',
        skillType: 'attack',
        description: '前線を押し込みながら制約を刻む。',
        targetPattern: 'line',
        range: 2,
        powerPerTile: 2,
        secondaryEffect: {
          type: 'debuff',
          key: 'fractured',
          value: 1,
          duration: 1,
          target: 'enemy',
        },
      },
    ],
    abilities: [
      {
        kind: 'ability',
        id: 'iron-vow',
        name: 'Iron Vow',
        source: 'trial',
        element: 'metal',
        abilityType: 'reaction',
        description: '封印を受けた直後、規律へ変換する。',
        trigger: {
          type: 'onStatusReceived',
          status: 'sealed',
        },
        effects: [
          {
            type: 'buff',
            key: 'focus',
            value: 1,
            duration: 1,
            target: 'self',
          },
        ],
      },
    ],
  };
}

function assertSameKeys(record, expectedKeys, label) {
  const actualKeys = Object.keys(record);
  const expectedJson = JSON.stringify(expectedKeys);
  const actualJson = JSON.stringify(actualKeys);

  if (actualJson !== expectedJson) {
    throw new Error(`Unexpected ${label} keys: expected ${expectedJson}, received ${actualJson}`);
  }
}

function assertExportJsonMatchesContract(saved) {
  if ('attributes' in saved || 'history' in saved) {
    throw new Error('Legacy attributes/history fields must not be preserved in Character Passport v1 export.');
  }

  if (saved.combatClass === 'rogue') {
    throw new Error('Legacy rogue combatClass must not be preserved in Character Passport v1 export.');
  }

  assertSameKeys(saved.baseAttributes, PASSPORT_EXPORT_CONTRACT.baseAttributes, 'baseAttributes');
  assertSameKeys(saved.faith.sources, PASSPORT_EXPORT_CONTRACT.growthCategories, 'faith.sources');
  assertSameKeys(saved.growth, PASSPORT_EXPORT_CONTRACT.growthCategories, 'growth');

  for (const category of PASSPORT_EXPORT_CONTRACT.growthCategories) {
    assertSameKeys(saved.growth[category], PASSPORT_EXPORT_CONTRACT.fivePhaseElements, `growth.${category}`);
  }

  for (const key of ['value', 'obedienceBias', 'commandInterpretation', 'hazardResponse', 'autonomyAlignment', 'trustBand']) {
    if (!(key in saved.faith)) {
      throw new Error(`Missing faith.${key} in Character Passport v1 export.`);
    }
  }

  if (!PASSPORT_EXPORT_CONTRACT.faithTrustBands.includes(saved.faith.trustBand)) {
    throw new Error(`Unexpected faith.trustBand: ${saved.faith.trustBand}`);
  }

  if (!Array.isArray(saved.skills) || !Array.isArray(saved.abilities)) {
    throw new Error('skills and abilities must be separate arrays.');
  }

  if (saved.skills.some((skill) => skill.kind !== 'skill')) {
    throw new Error('skills must contain skill entries only.');
  }

  if (saved.abilities.some((ability) => ability.kind !== 'ability')) {
    throw new Error('abilities must contain ability entries only.');
  }
}

if (process.argv[2] === 'smoke') {
  console.log('passport:smoke start');

  const passport = adaptCharacterPassportSourceToExport(sampleRenPassportSource());
  const filePath = await writeCharacterPassportFile(passport);
  const saved = JSON.parse(await readFile(filePath, 'utf-8'));
  const { assertPassportExportContractMatchesDomain } = await import('./passport-contract-smoke.mjs');

  await assertPassportExportContractMatchesDomain(PASSPORT_EXPORT_CONTRACT);

  if (saved.schemaVersion !== PASSPORT_EXPORT_CONTRACT.schemaVersion) {
    throw new Error(`Unexpected schemaVersion: ${saved.schemaVersion}`);
  }

  if (saved.element !== 'metal' || saved.combatClass !== 'mage') {
    throw new Error('Expected independent element/combatClass values to be preserved.');
  }

  if (saved.faith.trustBand !== 'steady') {
    throw new Error(`Expected trustBand steady, received ${saved.faith.trustBand}`);
  }

  if (saved.skills.length !== 1 || saved.abilities.length !== 1) {
    throw new Error('Expected one skill and one ability in the exported sample.');
  }

  assertExportJsonMatchesContract(saved);

  console.log('passport file:', filePath);
  console.log('passport schema ok:', saved.schemaVersion);
  console.log('passport adapter ok:', `${saved.element}/${saved.combatClass}`);
  console.log('element/combatClass independence preserved:', `${saved.element}/${saved.combatClass}`);

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
