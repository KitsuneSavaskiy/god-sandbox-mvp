const fallbackPassport = {
  schemaVersion: "1.0",
  characterId: "ryo-sample-001",
  displayName: "Ryo",
  summary: "森の村で暮らす、まじめで少し不器用な若者。",
  portraitImage: "/art/portraits/ryo/ryo_normal.jpeg",
  tags: ["まじめ", "村人", "成長中"],
};

const boardWidth = 10;
const boardHeight = 5;
const playerSideMaxX = 4;
const enemySideMinX = 5;
const moveDistance = 1;
const attackRange = 3;

const state = {
  passport: fallbackPassport,
  passportSource: "sample",
  selected: false,
  phase: "select",
  turn: 1,
  message: "キャラを選んでください。",
  logs: [],
  player: null,
  enemy: null,
  finished: false,
};

const nodes = {
  portrait: document.querySelector("#portrait"),
  portraitFallback: document.querySelector("#portraitFallback"),
  passportName: document.querySelector("#passportName"),
  passportSummary: document.querySelector("#passportSummary"),
  passportTags: document.querySelector("#passportTags"),
  playerHp: document.querySelector("#playerHp"),
  enemyHp: document.querySelector("#enemyHp"),
  turnCount: document.querySelector("#turnCount"),
  phaseText: document.querySelector("#phaseText"),
  instruction: document.querySelector("#instruction"),
  board: document.querySelector("#board"),
  battleLog: document.querySelector("#battleLog"),
  selectPlayer: document.querySelector("#selectPlayer"),
  reset: document.querySelector("#reset"),
  passportFile: document.querySelector("#passportFile"),
  fileStatus: document.querySelector("#fileStatus"),
};

function resolveSampleImagePath(src) {
  if (src?.startsWith("/art/")) {
    return `../../public${src}`;
  }

  return src;
}

async function loadPassport() {
  try {
    const response = await fetch("./sample-passport.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    addLog("JSONを直接読めなかったため、同じ内容の予備データで起動しました。");
    return fallbackPassport;
  }
}

function normalizePassport(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("not-object");
  }

  const displayName =
    typeof value.displayName === "string" && value.displayName.trim() !== ""
      ? value.displayName.trim()
      : typeof value.name === "string" && value.name.trim() !== ""
        ? value.name.trim()
        : "";

  if (!displayName) {
    throw new Error("missing-displayName");
  }

  return {
    schemaVersion: typeof value.schemaVersion === "string" ? value.schemaVersion : "1.0",
    characterId:
      typeof value.characterId === "string" && value.characterId.trim() !== ""
        ? value.characterId
        : "loaded-passport-character",
    displayName,
    summary:
      typeof value.summary === "string" && value.summary.trim() !== ""
        ? value.summary.trim()
        : "紹介文はまだありません。",
    portraitImage:
      typeof value.portraitImage === "string" && value.portraitImage.trim() !== ""
        ? value.portraitImage.trim()
        : undefined,
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag) => typeof tag === "string" && tag.trim() !== "").map((tag) => tag.trim())
      : [],
  };
}

async function loadPassportFromFile(file) {
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    state.passport = normalizePassport(parsed);
    state.passportSource = "file";
    state.fileStatusKind = "success";
    state.fileStatus = `${state.passport.displayName}を読み込みました。`;
    resetBattle();
  } catch (error) {
    state.fileStatusKind = "error";
    state.fileStatus =
      "このファイルは読み込めませんでした。GodSandboxから保存したキャラ情報JSONを選んでください。";
    addLog("キャラ情報JSONを確認してください。今のキャラのまま遊べます。");
    render();
  } finally {
    nodes.passportFile.value = "";
  }
}

function makePlayer(passport) {
  return {
    id: passport.characterId ?? "passport-character",
    name: passport.displayName ?? "Passport Character",
    image: resolveSampleImagePath(passport.portraitImage),
    hp: 10,
    maxHp: 10,
    attack: 3,
    x: 2,
    y: 2,
    side: "player",
    pose: "idle",
  };
}

function makeEnemy() {
  return {
    id: "paper-warden",
    name: "Paper Warden",
    hp: 10,
    maxHp: 10,
    attack: 3,
    x: 7,
    y: 2,
    side: "enemy",
    pose: "idle",
  };
}

function addLog(message) {
  state.logs.unshift(message);
  state.logs = state.logs.slice(0, 9);
}

function sameCell(unit, x, y) {
  return unit.x === x && unit.y === y;
}

function isPlayerSide(x) {
  return x <= playerSideMaxX;
}

function isEnemySide(x) {
  return x >= enemySideMinX;
}

function isAdjacentToPlayer(x, y) {
  return Math.abs(state.player.x - x) + Math.abs(state.player.y - y) === moveDistance;
}

function canPlayerMoveTo(x, y) {
  return (
    state.selected &&
    !state.finished &&
    isPlayerSide(x) &&
    isAdjacentToPlayer(x, y) &&
    !sameCell(state.enemy, x, y)
  );
}

function canPlayerAttackEnemy() {
  return (
    state.selected &&
    !state.finished &&
    state.player.y === state.enemy.y &&
    Math.abs(state.enemy.x - state.player.x) <= attackRange
  );
}

function canEnemyAttack() {
  return state.enemy.y === state.player.y && Math.abs(state.enemy.x - state.player.x) <= attackRange;
}

function selectPlayer() {
  if (state.finished) {
    return;
  }

  state.selected = true;
  state.phase = "player";
  state.message = "移動先、または攻撃する相手を選んでください。";
  addLog(`${state.player.name} を選びました。`);
  render();
}

function clearPosesLater() {
  window.setTimeout(() => {
    state.player.pose = "idle";
    state.enemy.pose = "idle";
    render();
  }, 420);
}

function movePlayerTo(x, y) {
  state.player.x = x;
  state.player.y = y;
  state.player.pose = "move";
  state.selected = false;
  addLog(`${state.player.name} が移動した。`);
  finishPlayerAction();
}

function attackEnemy() {
  state.player.pose = "attack";
  state.enemy.pose = "damage";
  state.enemy.hp = Math.max(0, state.enemy.hp - state.player.attack);
  state.selected = false;
  addLog(`${state.player.name} が攻撃した。${state.enemy.name} に ${state.player.attack} ダメージ。`);

  if (state.enemy.hp <= 0) {
    state.finished = true;
    state.phase = "win";
    state.message = "勝利！別のゲームでもキャラが動きました。";
    addLog("勝利！別のゲームでもキャラが動きました。");
    render();
    clearPosesLater();
    return;
  }

  finishPlayerAction();
}

function finishPlayerAction() {
  state.phase = "enemy";
  state.message = "敵が行動しています。";
  render();
  window.setTimeout(enemyAction, 460);
  clearPosesLater();
}

function enemyAction() {
  if (state.finished) {
    return;
  }

  if (canEnemyAttack()) {
    state.enemy.pose = "attack";
    state.player.pose = "damage";
    state.player.hp = Math.max(0, state.player.hp - state.enemy.attack);
    addLog(`${state.enemy.name} が反撃した。${state.player.name} は ${state.enemy.attack} ダメージを受けた。`);

    if (state.player.hp <= 0) {
      state.finished = true;
      state.phase = "lose";
      state.message = "敗北。リセットしてもう一度試せます。";
      addLog("敗北。リセットしてもう一度試せます。");
      render();
      clearPosesLater();
      return;
    }
  } else {
    moveEnemyTowardPlayer();
  }

  state.turn += 1;
  state.phase = "select";
  state.message = "キャラを選んでください。";
  render();
  clearPosesLater();
}

function moveEnemyTowardPlayer() {
  const candidates = [
    { x: state.enemy.x - 1, y: state.enemy.y },
    { x: state.enemy.x, y: state.enemy.y + Math.sign(state.player.y - state.enemy.y) },
    { x: state.enemy.x, y: state.enemy.y - Math.sign(state.enemy.y - state.player.y) },
    { x: state.enemy.x + 1, y: state.enemy.y },
  ].filter((position) => {
    return (
      position.x >= 0 &&
      position.x < boardWidth &&
      position.y >= 0 &&
      position.y < boardHeight &&
      isEnemySide(position.x) &&
      !sameCell(state.player, position.x, position.y)
    );
  });

  const currentDistance = Math.abs(state.enemy.x - state.player.x) + Math.abs(state.enemy.y - state.player.y);
  const best = candidates
    .map((position) => ({
      ...position,
      distance: Math.abs(position.x - state.player.x) + Math.abs(position.y - state.player.y),
    }))
    .filter((position) => position.distance < currentDistance)
    .sort((a, b) => a.distance - b.distance)[0];

  if (!best) {
    addLog(`${state.enemy.name} は動けなかった。`);
    return;
  }

  state.enemy.x = best.x;
  state.enemy.y = best.y;
  state.enemy.pose = "move";
  addLog(`${state.enemy.name} が近づいた。`);
}

function onCellClick(x, y) {
  if (state.finished) {
    return;
  }

  if (sameCell(state.player, x, y)) {
    selectPlayer();
    return;
  }

  if (sameCell(state.enemy, x, y)) {
    if (canPlayerAttackEnemy()) {
      attackEnemy();
    } else {
      state.message = "同じ行で3マス以内なら攻撃できます。";
      addLog("まだ攻撃が届きません。");
      render();
    }
    return;
  }

  if (canPlayerMoveTo(x, y)) {
    movePlayerTo(x, y);
    return;
  }

  if (state.selected) {
    state.message = "自陣内の上下左右1マスだけ移動できます。";
    addLog("そこには移動できません。");
    render();
  }
}

function resetBattle() {
  state.player = makePlayer(state.passport);
  state.enemy = makeEnemy();
  state.selected = false;
  state.phase = "select";
  state.turn = 1;
  state.finished = false;
  state.message = "キャラを選んでください。";
  state.logs = [
    `${state.player.name} を Character Passport から読み込みました。`,
    "HPや攻撃力は、このサンプルゲーム側で仮に決めています。",
  ];
  render();
}

function renderPassport() {
  nodes.passportName.textContent = state.passport.displayName ?? "Unknown";
  nodes.passportSummary.textContent = state.passport.summary ?? "紹介文はまだありません。";
  nodes.passportTags.replaceChildren(
    ...(state.passport.tags ?? []).map((tag) => {
      const element = document.createElement("span");
      element.className = "tag";
      element.textContent = tag;
      return element;
    }),
  );
  renderFileStatus();
  renderPortrait();
}

function renderFileStatus() {
  const defaultText =
    state.passportSource === "file"
      ? `${state.passport.displayName ?? "キャラ"}を読み込んでいます。別のJSONも選べます。`
      : "GodSandboxから保存したキャラ情報を選べます。選ばなくても、このサンプルのRyoで遊べます。";

  nodes.fileStatus.textContent = state.fileStatus ?? defaultText;
  nodes.fileStatus.classList.toggle("file-load__status--error", state.fileStatusKind === "error");
  nodes.fileStatus.classList.toggle("file-load__status--success", state.fileStatusKind === "success");
}

function renderPortrait() {
  const src = resolveSampleImagePath(state.passport.portraitImage);
  const fallbackLetter = (state.passport.displayName ?? "?").slice(0, 1);

  if (!src) {
    nodes.portrait.hidden = true;
    nodes.portraitFallback.hidden = false;
    nodes.portraitFallback.textContent = fallbackLetter;
    return;
  }

  nodes.portrait.hidden = false;
  nodes.portraitFallback.hidden = true;
  nodes.portrait.src = src;
  nodes.portrait.alt = `${state.passport.displayName ?? "Character"} portrait`;
  nodes.portrait.onerror = () => {
    nodes.portrait.hidden = true;
    nodes.portraitFallback.hidden = false;
    nodes.portraitFallback.textContent = fallbackLetter;
  };
}

function createStandee(unit) {
  const wrapper = document.createElement("div");
  wrapper.className = `unit unit--${unit.side} unit--${unit.pose}`;

  if (unit.side === "player" && state.selected) {
    wrapper.classList.add("unit--selected");
  }

  const standee = document.createElement("div");
  standee.className = unit.side === "enemy" ? "standee standee--enemy" : "standee";

  if (unit.image) {
    const image = document.createElement("img");
    image.src = unit.image;
    image.alt = `${unit.name} portrait`;
    image.onerror = () => {
      image.remove();
      const fallback = document.createElement("span");
      fallback.className = "standee-fallback";
      fallback.textContent = unit.name.slice(0, 1);
      standee.append(fallback);
    };
    standee.append(image);
  } else {
    const fallback = document.createElement("span");
    fallback.className = "standee-fallback";
    fallback.textContent = unit.name.slice(0, 1);
    standee.append(fallback);
  }

  const name = document.createElement("span");
  name.className = "unit__name";
  name.textContent = `${unit.name} ${unit.hp}`;

  wrapper.append(standee, name);
  return wrapper;
}

function renderBoard() {
  const cells = [];

  for (let y = 0; y < boardHeight; y += 1) {
    for (let x = 0; x < boardWidth; x += 1) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = `cell ${isPlayerSide(x) ? "cell--player-side" : "cell--enemy-side"}`;
      cell.addEventListener("click", () => onCellClick(x, y));

      if (canPlayerMoveTo(x, y)) {
        cell.classList.add("cell--selectable");
        cell.setAttribute("aria-label", `移動先 ${x + 1}, ${y + 1}`);
      } else if (sameCell(state.enemy, x, y) && canPlayerAttackEnemy()) {
        cell.classList.add("cell--targetable");
        cell.setAttribute("aria-label", "攻撃する相手");
      } else {
        cell.setAttribute("aria-label", `マス ${x + 1}, ${y + 1}`);
      }

      if (sameCell(state.player, x, y)) {
        cell.append(createStandee(state.player));
      }

      if (sameCell(state.enemy, x, y)) {
        cell.append(createStandee(state.enemy));
      }

      const coord = document.createElement("span");
      coord.className = "cell__coord";
      coord.textContent = `${x + 1}-${y + 1}`;
      cell.append(coord);
      cells.push(cell);
    }
  }

  nodes.board.replaceChildren(...cells);
}

function renderHud() {
  nodes.playerHp.textContent = `${state.player.hp} / ${state.player.maxHp}`;
  nodes.enemyHp.textContent = `${state.enemy.hp} / ${state.enemy.maxHp}`;
  nodes.turnCount.textContent = String(state.turn);
  nodes.phaseText.textContent = state.finished ? "終了" : state.selected ? "行動選択" : "選択待ち";
  nodes.instruction.textContent = state.message;
}

function renderLog() {
  nodes.battleLog.replaceChildren(
    ...state.logs.map((message) => {
      const item = document.createElement("li");
      item.textContent = message;
      return item;
    }),
  );
}

function render() {
  renderPassport();
  renderHud();
  renderBoard();
  renderLog();
  nodes.selectPlayer.disabled = state.finished;
}

nodes.selectPlayer.addEventListener("click", selectPlayer);
nodes.reset.addEventListener("click", resetBattle);
nodes.passportFile.addEventListener("change", (event) => loadPassportFromFile(event.target.files?.[0]));

try {
  state.passport = normalizePassport(await loadPassport());
} catch (error) {
  state.passport = fallbackPassport;
  state.fileStatusKind = "error";
  state.fileStatus = "最初のサンプルJSONを読めなかったため、予備のRyoで起動しました。";
}
resetBattle();
