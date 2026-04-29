import { readFile } from 'fs/promises';
import { resolve } from 'path';

function fail(message) {
  throw new Error(`Passport export contract drift: ${message}`);
}

function isExportedConst(statement, name, ts) {
  if (!ts.isVariableStatement(statement)) {
    return false;
  }

  const isExported = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
  if (!isExported) {
    return false;
  }

  return statement.declarationList.declarations.some(
    (declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === name,
  );
}

function unwrapExpression(expression, ts) {
  let current = expression;

  while (current && (ts.isAsExpression(current) || ts.isSatisfiesExpression(current))) {
    current = current.expression;
  }

  return current;
}

function readStringLiteral(expression, label, ts) {
  const current = unwrapExpression(expression, ts);

  if (!current || !ts.isStringLiteral(current)) {
    fail(`${label} must be a string literal`);
  }

  return current.text;
}

function readStringArray(expression, label, ts) {
  const current = unwrapExpression(expression, ts);

  if (!current || !ts.isArrayLiteralExpression(current)) {
    fail(`${label} must be an array literal`);
  }

  return current.elements.map((element, index) => readStringLiteral(element, `${label}[${index}]`, ts));
}

function readStringRecord(expression, label, ts) {
  const current = unwrapExpression(expression, ts);

  if (!current || !ts.isObjectLiteralExpression(current)) {
    fail(`${label} must be an object literal`);
  }

  const record = {};

  for (const property of current.properties) {
    if (!ts.isPropertyAssignment(property)) {
      fail(`${label} must contain only property assignments`);
    }

    const propertyName = property.name;
    const key = ts.isIdentifier(propertyName) || ts.isStringLiteral(propertyName) ? propertyName.text : null;
    if (!key) {
      fail(`${label} contains an unsupported property name`);
    }

    record[key] = readStringLiteral(property.initializer, `${label}.${key}`, ts);
  }

  return record;
}

async function parseSource(relativePath, ts) {
  const filePath = resolve(process.cwd(), relativePath);
  const text = await readFile(filePath, 'utf-8');

  return ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

function findExportedConst(sourceFile, name, ts) {
  for (const statement of sourceFile.statements) {
    if (!isExportedConst(statement, name, ts)) {
      continue;
    }

    const declaration = statement.declarationList.declarations.find(
      (entry) => ts.isIdentifier(entry.name) && entry.name.text === name,
    );

    if (!declaration?.initializer) {
      fail(`${name} must have an initializer`);
    }

    return declaration.initializer;
  }

  fail(`${name} was not found`);
}

function assertSameJson(actual, expected, label) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    fail(`${label} differs. server=${actualJson} domain=${expectedJson}`);
  }
}

export async function assertPassportExportContractMatchesDomain(contract) {
  const ts = await import('typescript');
  const fivePhases = await parseSource('src/domain/passport/fivePhases.ts', ts);
  const faith = await parseSource('src/domain/passport/faith.ts', ts);
  const growth = await parseSource('src/domain/passport/growth.ts', ts);
  const characterPassport = await parseSource('src/domain/passport/characterPassport.ts', ts);

  assertSameJson(
    contract.schemaVersion,
    readStringLiteral(
      findExportedConst(characterPassport, 'CHARACTER_PASSPORT_SCHEMA_VERSION', ts),
      'CHARACTER_PASSPORT_SCHEMA_VERSION',
      ts,
    ),
    'schemaVersion',
  );
  assertSameJson(
    contract.fivePhaseElements,
    readStringArray(findExportedConst(fivePhases, 'FIVE_PHASE_ELEMENTS', ts), 'FIVE_PHASE_ELEMENTS', ts),
    'fivePhaseElements',
  );
  assertSameJson(
    contract.combatClasses,
    readStringArray(findExportedConst(fivePhases, 'COMBAT_CLASSES', ts), 'COMBAT_CLASSES', ts),
    'combatClasses',
  );
  assertSameJson(
    contract.combatClassByElement,
    readStringRecord(findExportedConst(fivePhases, 'COMBAT_CLASS_BY_ELEMENT', ts), 'COMBAT_CLASS_BY_ELEMENT', ts),
    'combatClassByElement',
  );
  assertSameJson(
    contract.baseAttributes,
    readStringArray(findExportedConst(fivePhases, 'BASIC_ATTRIBUTES', ts), 'BASIC_ATTRIBUTES', ts),
    'baseAttributes',
  );
  assertSameJson(
    contract.faithObedienceBiases,
    readStringArray(findExportedConst(faith, 'FAITH_OBEDIENCE_BIASES', ts), 'FAITH_OBEDIENCE_BIASES', ts),
    'faithObedienceBiases',
  );
  assertSameJson(
    contract.faithCommandInterpretations,
    readStringArray(
      findExportedConst(faith, 'FAITH_COMMAND_INTERPRETATIONS', ts),
      'FAITH_COMMAND_INTERPRETATIONS',
      ts,
    ),
    'faithCommandInterpretations',
  );
  assertSameJson(
    contract.faithHazardResponses,
    readStringArray(findExportedConst(faith, 'FAITH_HAZARD_RESPONSES', ts), 'FAITH_HAZARD_RESPONSES', ts),
    'faithHazardResponses',
  );
  assertSameJson(
    contract.faithAutonomyAlignments,
    readStringArray(findExportedConst(faith, 'FAITH_AUTONOMY_ALIGNMENTS', ts), 'FAITH_AUTONOMY_ALIGNMENTS', ts),
    'faithAutonomyAlignments',
  );
  assertSameJson(
    contract.faithTrustBands,
    readStringArray(findExportedConst(faith, 'FAITH_TRUST_BANDS', ts), 'FAITH_TRUST_BANDS', ts),
    'faithTrustBands',
  );
  assertSameJson(
    contract.growthCategories,
    readStringArray(findExportedConst(growth, 'GROWTH_CATEGORIES', ts), 'GROWTH_CATEGORIES', ts),
    'growthCategories',
  );
}
