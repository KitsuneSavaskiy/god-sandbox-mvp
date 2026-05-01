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

const defaultWorldSettings = {
  playerHp: 10,
  enemyHp: 10,
  playerAttack: 3,
  enemyAttack: 3,
  attackRange: 3,
  playerDamageReduction: 0,
  activeLawIds: [],
};

const worldLawCatalog = [
  {
    id: "gentle-world",
    label: "やさしい世界",
    description: "この世界では主人公が少し倒れにくくなります。",
    effects: { playerHpBonus: 2 },
  },
  {
    id: "strict-world",
    label: "厳しい世界",
    description: "この世界では敵の一撃が少し重くなります。",
    effects: { enemyAttackBonus: 1 },
  },
  {
    id: "far-reaching-voice",
    label: "遠くまで届く声",
    description: "この世界では少し遠くの相手にも攻撃が届きます。",
    effects: { attackRangeBonus: 1 },
  },
  {
    id: "protective-blessing",
    label: "守りの加護",
    description: "この世界では主人公が受けるダメージを少し減らします。",
    effects: { playerDamageReductionBonus: 1 },
  },
];

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
  worldSettings: { ...defaultWorldSettings },
  battleSettings: { ...defaultWorldSettings },
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
  passportPaste: document.querySelector("#passportPaste"),
  loadPassportPaste: document.querySelector("#loadPassportPaste"),
  fileStatus: document.querySelector("#fileStatus"),
  passportInfoList: document.querySelector("#passportInfoList"),
  worldRuleList: document.querySelector("#worldRuleList"),
  worldPlayerHp: document.querySelector("#worldPlayerHp"),
  worldEnemyHp: document.querySelector("#worldEnemyHp"),
  worldPlayerAttack: document.querySelector("#worldPlayerAttack"),
  worldEnemyAttack: document.querySelector("#worldEnemyAttack"),
  worldAttackRange: document.querySelector("#worldAttackRange"),
  rebuildWorld: document.querySelector("#rebuildWorld"),
  lawCardSelect: document.querySelector("#lawCardSelect"),
  addLawCard: document.querySelector("#addLawCard"),
  activeLawCards: document.querySelector("#activeLawCards"),
  appliedWorldRules: document.querySelector("#appliedWorldRules"),
};

function clampNumber(value, min, max, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(number)));
}

function getLawById(id) {
  return worldLawCatalog.find((law) => law.id === id);
}

function getAppliedWorldSettings() {
  const applied = {
    playerHp: clampNumber(state.worldSettings.playerHp, 1, 30, defaultWorldSettings.playerHp),
    enemyHp: clampNumber(state.worldSettings.enemyHp, 1, 30, defaultWorldSettings.enemyHp),
    playerAttack: clampNumber(state.worldSettings.playerAttack, 1, 12, defaultWorldSettings.playerAttack),
    enemyAttack: clampNumber(state.worldSettings.enemyAttack, 1, 12, defaultWorldSettings.enemyAttack),
    attackRange: clampNumber(state.worldSettings.attackRange, 1, 8, defaultWorldSettings.attackRange),
    playerDamageReduction: clampNumber(
      state.worldSettings.playerDamageReduction,
      0,
      6,
      defaultWorldSettings.playerDamageReduction,
    ),
  };

  for (const lawId of state.worldSettings.activeLawIds) {
    const law = getLawById(lawId);
    if (!law) {
      continue;
    }

    applied.playerHp += law.effects.playerHpBonus ?? 0;
    applied.enemyHp += law.effects.enemyHpBonus ?? 0;
    applied.playerAttack += law.effects.playerAttackBonus ?? 0;
    applied.enemyAttack += law.effects.enemyAttackBonus ?? 0;
    applied.attackRange += law.effects.attackRangeBonus ?? 0;
    applied.playerDamageReduction += law.effects.playerDamageReductionBonus ?? 0;
  }

  return {
    playerHp: clampNumber(applied.playerHp, 1, 40, defaultWorldSettings.playerHp),
    enemyHp: clampNumber(applied.enemyHp, 1, 40, defaultWorldSettings.enemyHp),
    playerAttack: clampNumber(applied.playerAttack, 1, 16, defaultWorldSettings.playerAttack),
    enemyAttack: clampNumber(applied.enemyAttack, 1, 16, defaultWorldSettings.enemyAttack),
    attackRange: clampNumber(applied.attackRange, 1, 10, defaultWorldSettings.attackRange),
    playerDamageReduction: clampNumber(applied.playerDamageReduction, 0, 8, defaultWorldSettings.playerDamageReduction),
  };
}

function formatRuleValue(label, value) {
  return `${label}: ${value}`;
}

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

function getPassportSourceLabel(source) {
  if (source === "paste") {
    return "貼り付けたJSON";
  }

  if (source === "file") {
    return "選んだJSON";
  }

  return "このサンプルのRyo";
}

function parsePassportText(text) {
  if (typeof text !== "string" || text.trim() === "") {
    throw new Error("empty-json");
  }

  return normalizePassport(JSON.parse(text));
}

function describePassportLoadError(source, error) {
  if (error instanceof SyntaxError) {
    if (source === "paste") {
      return "JSONの形が途中で崩れているようです。GodSandboxの「キャラ情報をコピー」を押して、最初の { から最後の } までそのまま貼り付けてください。今のキャラはそのままです。";
    }

    return "このJSONファイルは途中で壊れているようです。GodSandboxから出したキャラ情報JSONを選び直してください。今のキャラはそのままです。";
  }

  switch (error?.message) {
    case "empty-json":
      return "まだJSONが入っていません。GodSandboxの「キャラ情報をコピー」を押して、この欄へ貼り付けてください。今のキャラはそのままです。";
    case "not-object":
      return "このJSONはキャラ情報の形ではなさそうです。GodSandboxのキャラ情報JSONをそのまま使ってください。今のキャラはそのままです。";
    case "missing-displayName":
      return "このJSONにはキャラ名が見つかりませんでした。`displayName` が入ったキャラ情報JSONを使ってください。今のキャラはそのままです。";
    default:
      return "キャラ情報JSONを読み込めませんでした。GodSandboxからコピーした内容か、保存したJSONファイルをもう一度確認してください。今のキャラはそのままです。";
  }
}

function showPassportLoadError(source, error) {
  state.fileStatusKind = "error";
  state.fileStatus = describePassportLoadError(source, error);
  addLog(`${getPassportSourceLabel(source)}を読み込めませんでした。今のキャラのまま遊べます。`);
  render();
}

function applyLoadedPassport(passport, source) {
  state.passport = passport;
  state.passportSource = source;
  state.fileStatusKind = "success";
  state.fileStatus =
    source === "paste"
      ? `${state.passport.displayName}を貼り付けたJSONから読み込みました。`
      : `${state.passport.displayName}を選んだJSONから読み込みました。`;
  resetBattle();
}

async function loadPassportFromFile(file) {
  if (!file) {
    return;
  }

  try {
    const passport = parsePassportText(await file.text());
    applyLoadedPassport(passport, "file");
  } catch (error) {
    showPassportLoadError("file", error);
  } finally {
    nodes.passportFile.value = "";
  }
}

function loadPassportFromPaste() {
  try {
    const passport = parsePassportText(nodes.passportPaste.value);
    applyLoadedPassport(passport, "paste");
  } catch (error) {
    showPassportLoadError("paste", error);
  }
}

function makePlayer(passport, settings) {
  return {
    id: passport.characterId ?? "passport-character",
    name: passport.displayName ?? "Passport Character",
    image: resolveSampleImagePath(passport.portraitImage),
    hp: settings.playerHp,
    maxHp: settings.playerHp,
    attack: settings.playerAttack,
    x: 2,
    y: 2,
    side: "player",
    pose: "idle",
  };
}

function makeEnemy(settings) {
  return {
    id: "paper-warden",
    name: "Paper Warden",
    hp: settings.enemyHp,
    maxHp: settings.enemyHp,
    attack: settings.enemyAttack,
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
    Math.abs(state.enemy.x - state.player.x) <= state.battleSettings.attackRange
  );
}

function canEnemyAttack() {
  return state.enemy.y === state.player.y && Math.abs(state.enemy.x - state.player.x) <= state.battleSettings.attackRange;
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
    const damage = Math.max(0, state.enemy.attack - state.battleSettings.playerDamageReduction);
    state.player.hp = Math.max(0, state.player.hp - damage);
    addLog(`${state.enemy.name} が反撃した。${state.player.name} は ${damage} ダメージを受けた。`);

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
      state.message = `同じ行で${state.battleSettings.attackRange}マス以内なら攻撃できます。`;
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

function resetBattle(reason = "reset") {
  state.battleSettings = getAppliedWorldSettings();
  state.player = makePlayer(state.passport, state.battleSettings);
  state.enemy = makeEnemy(state.battleSettings);
  state.selected = false;
  state.phase = "select";
  state.turn = 1;
  state.finished = false;
  state.message = "キャラを選んでください。";
  state.logs = [
    `${state.player.name} を Character Passport から読み込みました。`,
    "HPや攻撃力は、このサンプルゲーム側の世界の法律で決めています。",
  ];

  if (reason === "world-law") {
    state.logs.unshift("世界の法律を作り直しました。キャラクター紹介状はそのままです。");
  }

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
  const defaultText = (() => {
    if (state.passportSource === "paste") {
      return `${state.passport.displayName ?? "キャラ"}を貼り付けから読み込んでいます。貼り付け内容を変えると、別のキャラにも切り替えられます。`;
    }

    if (state.passportSource === "file") {
      return `${state.passport.displayName ?? "キャラ"}をJSONファイルから読み込んでいます。別のJSONも選べます。`;
    }

    return "GodSandboxからコピーして貼り付けるか、保存したキャラ情報JSONを選べます。何も読み込まなくても、このサンプルのRyoで遊べます。";
  })();

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

function createListItem(text) {
  const item = document.createElement("li");
  item.textContent = text;
  return item;
}

function renderPassportWorldBridge() {
  const passportItems = [
    `名前: ${state.passport.displayName ?? "Unknown"}`,
    `紹介文: ${state.passport.summary ?? "紹介文はまだありません。"}`,
    `タグ: ${(state.passport.tags ?? []).join(" / ") || "タグなし"}`,
    `画像: ${state.passport.portraitImage ? "Passportから読みます" : "画像なしなら頭文字を表示します"}`,
  ];

  const battleItems = [
    formatRuleValue("自キャラHP", state.battleSettings.playerHp),
    formatRuleValue("敵HP", state.battleSettings.enemyHp),
    formatRuleValue("自キャラ攻撃力", state.battleSettings.playerAttack),
    formatRuleValue("敵攻撃力", state.battleSettings.enemyAttack),
    formatRuleValue("攻撃射程", `${state.battleSettings.attackRange}マス`),
  ];

  if (state.battleSettings.playerDamageReduction > 0) {
    battleItems.push(formatRuleValue("受けるダメージ軽減", state.battleSettings.playerDamageReduction));
  }

  nodes.passportInfoList.replaceChildren(...passportItems.map(createListItem));
  nodes.worldRuleList.replaceChildren(...battleItems.map(createListItem));
}

function renderWorldSettingInputs() {
  nodes.worldPlayerHp.value = String(state.worldSettings.playerHp);
  nodes.worldEnemyHp.value = String(state.worldSettings.enemyHp);
  nodes.worldPlayerAttack.value = String(state.worldSettings.playerAttack);
  nodes.worldEnemyAttack.value = String(state.worldSettings.enemyAttack);
  nodes.worldAttackRange.value = String(state.worldSettings.attackRange);
}

function renderLawCardSelect() {
  const options = worldLawCatalog.map((law) => {
    const option = document.createElement("option");
    option.value = law.id;
    option.textContent = `${law.label}: ${law.description}`;
    option.disabled = state.worldSettings.activeLawIds.includes(law.id);
    return option;
  });

  nodes.lawCardSelect.replaceChildren(...options);
}

function renderActiveLawCards() {
  const activeLaws = state.worldSettings.activeLawIds.map(getLawById).filter(Boolean);

  if (activeLaws.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-note";
    empty.textContent = "まだ法則カードは追加されていません。";
    nodes.activeLawCards.replaceChildren(empty);
    return;
  }

  nodes.activeLawCards.replaceChildren(
    ...activeLaws.map((law) => {
      const card = document.createElement("article");
      card.className = "law-card";

      const title = document.createElement("strong");
      title.textContent = law.label;

      const description = document.createElement("p");
      description.textContent = law.description;

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "text-button";
      removeButton.textContent = "この法則を外す";
      removeButton.addEventListener("click", () => {
        state.worldSettings.activeLawIds = state.worldSettings.activeLawIds.filter((id) => id !== law.id);
        render();
      });

      card.append(title, description, removeButton);
      return card;
    }),
  );
}

function renderAppliedWorldRules() {
  const nextSettings = getAppliedWorldSettings();
  const items = [
    `次に作る世界の自キャラHP: ${nextSettings.playerHp}`,
    `次に作る世界の敵HP: ${nextSettings.enemyHp}`,
    `次に作る世界の自キャラ攻撃力: ${nextSettings.playerAttack}`,
    `次に作る世界の敵攻撃力: ${nextSettings.enemyAttack}`,
    `次に作る世界の攻撃射程: ${nextSettings.attackRange}マス`,
  ];

  if (nextSettings.playerDamageReduction > 0) {
    items.push(`主人公が受けるダメージ軽減: ${nextSettings.playerDamageReduction}`);
  }

  nodes.appliedWorldRules.replaceChildren(...items.map(createListItem));
}

function renderWorldLawPanel() {
  renderWorldSettingInputs();
  renderLawCardSelect();
  renderActiveLawCards();
  renderAppliedWorldRules();
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
  renderPassportWorldBridge();
  renderWorldLawPanel();
  renderHud();
  renderBoard();
  renderLog();
  nodes.selectPlayer.disabled = state.finished;
}

function updateWorldSetting(key, value, min, max) {
  state.worldSettings[key] = clampNumber(value, min, max, defaultWorldSettings[key]);
  render();
}

function addSelectedLawCard() {
  const lawId = nodes.lawCardSelect.value;

  if (!lawId || state.worldSettings.activeLawIds.includes(lawId)) {
    return;
  }

  state.worldSettings.activeLawIds = [...state.worldSettings.activeLawIds, lawId];
  render();
}

nodes.selectPlayer.addEventListener("click", selectPlayer);
nodes.reset.addEventListener("click", () => resetBattle());
nodes.passportFile.addEventListener("change", (event) => loadPassportFromFile(event.target.files?.[0]));
nodes.loadPassportPaste.addEventListener("click", loadPassportFromPaste);
nodes.worldPlayerHp.addEventListener("change", (event) => updateWorldSetting("playerHp", event.target.value, 1, 30));
nodes.worldEnemyHp.addEventListener("change", (event) => updateWorldSetting("enemyHp", event.target.value, 1, 30));
nodes.worldPlayerAttack.addEventListener("change", (event) =>
  updateWorldSetting("playerAttack", event.target.value, 1, 12),
);
nodes.worldEnemyAttack.addEventListener("change", (event) =>
  updateWorldSetting("enemyAttack", event.target.value, 1, 12),
);
nodes.worldAttackRange.addEventListener("change", (event) => updateWorldSetting("attackRange", event.target.value, 1, 8));
nodes.rebuildWorld.addEventListener("click", () => resetBattle("world-law"));
nodes.addLawCard.addEventListener("click", addSelectedLawCard);

try {
  state.passport = normalizePassport(await loadPassport());
} catch (error) {
  state.passport = fallbackPassport;
  state.fileStatusKind = "error";
  state.fileStatus = "最初のサンプルJSONを読めなかったため、予備のRyoで起動しました。";
}
resetBattle();
