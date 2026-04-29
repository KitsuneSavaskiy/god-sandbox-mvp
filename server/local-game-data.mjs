import { readFile, writeFile, mkdir, unlink } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const DATA_ROOT = resolve(process.cwd(), 'god-sandbox-data');

function validateName(name) {
  if (!name || typeof name !== 'string') {
    throw new Error(`Invalid name: must be a non-empty string.`);
  }
  if (name.includes('/') || name.includes('\\') || name.includes('..')) {
    throw new Error(`Invalid name "${name}": must not contain '/', '\\', or '..'.`);
  }
}

async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

async function readJson(filePath) {
  let raw;
  try {
    raw = await readFile(filePath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Malformed JSON in ${filePath}`);
  }
}

async function writeJson(filePath, data) {
  await ensureDir(dirname(filePath));
  await writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

export async function readConfig() {
  return readJson(join(DATA_ROOT, 'config', 'local-config.json'));
}

export async function writeConfig(data) {
  return writeJson(join(DATA_ROOT, 'config', 'local-config.json'), data);
}

export async function readSave(saveName) {
  validateName(saveName);
  return readJson(join(DATA_ROOT, 'saves', `${saveName}.json`));
}

export async function writeSave(saveName, data) {
  validateName(saveName);
  return writeJson(join(DATA_ROOT, 'saves', `${saveName}.json`), data);
}

export async function readSession(sessionName) {
  validateName(sessionName);
  return readJson(join(DATA_ROOT, 'sessions', `${sessionName}.json`));
}

export async function writeSession(sessionName, data) {
  validateName(sessionName);
  return writeJson(join(DATA_ROOT, 'sessions', `${sessionName}.json`), data);
}

// Smoke test — runs when invoked directly: node server/local-game-data.mjs
const __filename = fileURLToPath(import.meta.url);
const isMain = Boolean(process.argv[1]) && resolve(process.argv[1]) === __filename;

if (isMain) {
  console.log('data:smoke start');

  await writeConfig({ gameVersion: '0.1.0', locale: 'ja' });
  const cfg = await readConfig();
  console.log('config ok:', JSON.stringify(cfg));

  await writeSave('default-world', { world: 'default', tick: 0 });
  const save = await readSave('default-world');
  console.log('save ok:', JSON.stringify(save));

  await writeSession('local-session', { playerId: 'local-user', startedAt: new Date().toISOString() });
  const session = await readSession('local-session');
  console.log('session ok:', JSON.stringify(session));

  // Malformed JSON
  const badFile = join(DATA_ROOT, 'saves', '_bad.json');
  await writeFile(badFile, '{ broken json', 'utf-8');
  try {
    await readSave('_bad');
    console.error('FAIL: should have thrown on malformed JSON');
    process.exit(1);
  } catch (err) {
    console.log('malformed JSON rejected:', err.message);
  }
  await unlink(badFile);

  // Path traversal
  try {
    await readSave('../etc/passwd');
    console.error('FAIL: should have rejected path traversal');
    process.exit(1);
  } catch (err) {
    console.log('path traversal rejected:', err.message);
  }

  // Slash in name
  try {
    await readSave('foo/bar');
    console.error('FAIL: should have rejected slash in name');
    process.exit(1);
  } catch (err) {
    console.log('slash in name rejected:', err.message);
  }

  console.log('data:smoke OK');
}
