import type {
  BloodlineSummary,
  Character,
  DayPhase,
  EventSummary,
  InterventionKind,
  LogEntry,
  Season,
  TimeControl,
  WorldEvent,
  WorldState,
} from "./types";

const AGE_INTERVAL_TICKS = 4;
const ROUTINE_FLOW_INTERVAL = 5;
const STARTUP_GRACE_TICKS = 12;
const INTERVENTION_COOLDOWN_TICKS = 15;
const MILESTONE_AGES = [18, 30, 45, 60];
const MAX_LOGS = 12;
const EXTINCTION_LOG = "生存者がいなくなりました。箱庭時間を停止し、残された記録だけを見守ります。";
const RECOVERY_LOG = "イベント状態が失われたため、観察状態へ復帰しました。";
const DAY_PHASES: DayPhase[] = ["morning", "noon", "evening"];
const SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];

function buildCharacters(): Character[] {
  return [
    {
      id: "aki",
      name: "Aki",
      bloodlineId: "sol",
      bloodlineName: "日輪",
      age: 17,
      lifespanRemaining: 8,
      role: "Support",
      element: "Wood",
      yinYang: "Balanced",
      alive: true,
      favorite: true,
      blessings: 1,
      trials: 0,
      deathReason: null,
      notable: ["芽吹きを見守る"],
      milestoneHistory: [],
      warningIssued: false,
      position: { x: -3.5, z: -2.2 },
    },
    {
      id: "reo",
      name: "Reo",
      bloodlineId: "sol",
      bloodlineName: "日輪",
      age: 29,
      lifespanRemaining: 6,
      role: "Vanguard",
      element: "Fire",
      yinYang: "Yang",
      alive: true,
      favorite: false,
      blessings: 0,
      trials: 1,
      deathReason: null,
      notable: ["前線で鍛えられた"],
      milestoneHistory: [],
      warningIssued: false,
      position: { x: -1.1, z: 1.9 },
    },
    {
      id: "mio",
      name: "Mio",
      bloodlineId: "nami",
      bloodlineName: "潮音",
      age: 19,
      lifespanRemaining: 5,
      role: "Artillery",
      element: "Water",
      yinYang: "Yin",
      alive: true,
      favorite: false,
      blessings: 0,
      trials: 0,
      deathReason: null,
      notable: ["遠見の資質"],
      milestoneHistory: [],
      warningIssued: false,
      position: { x: 2.1, z: -1.4 },
    },
    {
      id: "ren",
      name: "Ren",
      bloodlineId: "nami",
      bloodlineName: "潮音",
      age: 52,
      lifespanRemaining: 2,
      role: "Support",
      element: "Metal",
      yinYang: "Balanced",
      alive: true,
      favorite: true,
      blessings: 2,
      trials: 2,
      deathReason: null,
      notable: ["古傷を抱えつつ導く"],
      milestoneHistory: [45],
      warningIssued: false,
      position: { x: 3.8, z: 2.4 },
    },
  ];
}

function nextLog(logSerial: number, tone: LogEntry["tone"], message: string): LogEntry {
  return {
    id: `log-${logSerial}`,
    tone,
    message,
  };
}

function pushLog(state: WorldState, tone: LogEntry["tone"], message: string): WorldState {
  const entry = nextLog(state.logSerial + 1, tone, message);

  return {
    ...state,
    logSerial: state.logSerial + 1,
    logs: [entry, ...state.logs].slice(0, MAX_LOGS),
  };
}

function createSummary(
  layer: EventSummary["layer"],
  trigger: EventSummary["trigger"],
  title: string,
  description: string,
  targetCharacterName: string,
  tick: number,
): EventSummary {
  return {
    layer,
    trigger,
    title,
    description,
    targetCharacterName,
    tick,
  };
}

function applySummary(
  state: WorldState,
  summary: EventSummary,
  tone: LogEntry["tone"] = "event",
  writeLog = true,
): WorldState {
  const nextState: WorldState = {
    ...state,
    latestEventSummary: summary,
  };

  if (!writeLog) {
    return nextState;
  }

  return pushLog(nextState, tone, `${summary.title}: ${summary.description}`);
}

function getCharacterById(characters: Character[], id: string): Character | undefined {
  return characters.find((character) => character.id === id);
}

function hasLivingCharacters(characters: Character[]): boolean {
  return characters.some((character) => character.alive);
}

function findAliveTarget(characters: Character[], preferredId: string): Character | undefined {
  return (
    characters.find((character) => character.id === preferredId && character.alive) ??
    characters.find((character) => character.alive)
  );
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function findCharacterByName(characters: Character[], rawName: string): Character | undefined {
  const normalized = normalizeName(rawName);

  return characters.find((character) => normalizeName(character.name) === normalized);
}

function getInterventionTitle(trigger: WorldEvent["trigger"], target: Character) {
  switch (trigger) {
    case "warning":
      return `${target.name} の命運が揺れています`;
    case "manual":
    default:
      return `${target.name} に神託を降ろします`;
  }
}

function getInterventionDescription(trigger: WorldEvent["trigger"], target: Character) {
  switch (trigger) {
    case "warning":
      return `${target.name} の残寿命は ${target.lifespanRemaining}。ここでの介入が、最期の時間の意味を変えるかもしれません。`;
    case "manual":
    default:
      return `使徒が ${target.name} へ意識を集中させました。開発確認用の手動イベントです。`;
  }
}

function buildInterventionEvent(target: Character, trigger: "manual" | "warning", tick: number): WorldEvent {
  return {
    id: `event-${tick}-${target.id}-${trigger}`,
    title: getInterventionTitle(trigger, target),
    description: getInterventionDescription(trigger, target),
    trigger,
    layer: "intervention",
    targetCharacterId: target.id,
    targetCharacterName: target.name,
  };
}

function buildAgingSummary(target: Character, tick: number): EventSummary {
  return createSummary(
    "flow",
    "aging",
    `${target.name} が静かに時を重ねました`,
    `${target.bloodlineName} の気配をまといながら、次の節目へ少しずつ近づいています。`,
    target.name,
    tick,
  );
}

function buildRoutineSummary(target: Character, tick: number): EventSummary {
  return createSummary(
    "flow",
    "routine",
    `${target.name} は日々を過ごしています`,
    `${target.bloodlineName} の個体として穏やかな時間を重ねています。いまは観察の時間です。`,
    target.name,
    tick,
  );
}

function buildMilestoneSummary(target: Character, tick: number): EventSummary {
  return createSummary(
    "notable",
    "milestone",
    `${target.name} が年齢の節目に入りました`,
    `${target.name} は age ${target.age} となり、進路を考える下地が整いました。`,
    target.name,
    tick,
  );
}

function buildWarningSummary(target: Character, tick: number): EventSummary {
  return createSummary(
    "notable",
    "warning",
    `${target.name} の命火が弱まっています`,
    `${target.name} の残寿命は ${target.lifespanRemaining}。まだ止めずに観察できますが、見逃せない変化です。`,
    target.name,
    tick,
  );
}

function buildDeathSummary(target: Character, tick: number, deathReason: string): EventSummary {
  return createSummary(
    "notable",
    "death",
    `${target.name} が生涯を終えました`,
    deathReason,
    target.name,
    tick,
  );
}

function beginEvent(state: WorldState, event: WorldEvent, apostleMessage: string): WorldState {
  const summary = createSummary(
    "intervention",
    event.trigger,
    event.title,
    event.description,
    event.targetCharacterName,
    state.tick,
  );

  const withFocus: WorldState = {
    ...state,
    phase: "event",
    focusCharacterId: event.targetCharacterId,
    activeEvent: event,
    apostleMessage,
    latestEventSummary: summary,
  };

  return pushLog(withFocus, "event", `${event.title}: ${event.description}`);
}

function ensureObservingState(state: WorldState, apostleMessage: string, logMessage: string): WorldState {
  const nextState = pushLog(
    {
      ...state,
      phase: "observing",
      activeEvent: null,
      apostleMessage,
      timeControl: state.timeControl === "normal" || state.timeControl === "slow" ? state.timeControl : "stopped",
    },
    "system",
    logMessage,
  );

  return {
    ...nextState,
  };
}

function isWithinStartupGrace(tick: number) {
  return tick < STARTUP_GRACE_TICKS;
}

function getDeathReason(character: Character): string {
  if (character.trials > character.blessings) {
    return "試練の傷を抱えたまま寿命が尽きました。";
  }

  if (character.blessings > character.trials) {
    return "加護に包まれていても、寿命の巡りはここで尽きました。";
  }

  return "静かに寿命を迎えました。";
}

function resolveDeaths(state: WorldState): WorldState {
  let changed = false;
  let nextState: WorldState = state;
  const characters = state.characters.map((character) => {
    if (!character.alive || character.lifespanRemaining > 0) {
      return character;
    }

    changed = true;
    const deathReason = getDeathReason(character);
    const summary = buildDeathSummary(character, state.tick, deathReason);
    nextState = applySummary(nextState, summary, "system", true);

    return {
      ...character,
      alive: false,
      warningIssued: true,
      deathReason,
    };
  });

  if (!changed) {
    return state;
  }

  nextState = {
    ...nextState,
    characters,
  };

  const activeFocus = findAliveTarget(nextState.characters, nextState.focusCharacterId);

  if (!activeFocus) {
    const alreadyLogged = nextState.logs.some((log) => log.message === EXTINCTION_LOG);
    const extinctionState: WorldState = {
      ...nextState,
      phase: "observing",
      activeEvent: null,
      timeControl: "stopped",
      apostleMessage: "使徒は静かな世界の残響を聞いています。生存者はいません。",
    };

    return alreadyLogged ? extinctionState : pushLog(extinctionState, "system", EXTINCTION_LOG);
  }

  return {
    ...nextState,
    focusCharacterId: activeFocus.id,
    apostleMessage: `使徒は ${activeFocus.name} に視線を移し、箱庭の流れを見守っています。`,
  };
}

function applyAging(state: WorldState): WorldState {
  const nextTick = state.tick + 1;
  const shouldAge = nextTick % AGE_INTERVAL_TICKS === 0;

  if (!shouldAge) {
    return {
      ...state,
      tick: nextTick,
    };
  }

  const protectedWindow = isWithinStartupGrace(nextTick);
  const characters = state.characters.map((character) => {
    if (!character.alive) {
      return character;
    }

    const nextLifespan = Math.max(0, character.lifespanRemaining - 1);

    return {
      ...character,
      age: character.age + 1,
      lifespanRemaining: protectedWindow ? Math.max(2, nextLifespan) : nextLifespan,
    };
  });

  let nextState: WorldState = {
    ...state,
    tick: nextTick,
    ageStep: state.ageStep + 1,
    characters,
  };

  const flowTarget = findAliveTarget(characters, state.focusCharacterId);
  if (flowTarget) {
    nextState = applySummary(nextState, buildAgingSummary(flowTarget, nextTick), "system", true);
  }

  return nextState;
}

function applyNotableEvents(state: WorldState): WorldState {
  let nextState = state;

  const milestoneTarget = state.characters.find(
    (character) =>
      character.alive &&
      MILESTONE_AGES.some(
        (milestone) => milestone === character.age && !character.milestoneHistory.includes(milestone),
      ),
  );

  if (milestoneTarget) {
    nextState = {
      ...nextState,
      characters: nextState.characters.map((character) => {
        if (character.id !== milestoneTarget.id) {
          return character;
        }

        const milestone = MILESTONE_AGES.find((value) => value === character.age);
        if (!milestone || character.milestoneHistory.includes(milestone)) {
          return character;
        }

        return {
          ...character,
          milestoneHistory: [...character.milestoneHistory, milestone],
        };
      }),
    };

    nextState = applySummary(nextState, buildMilestoneSummary(milestoneTarget, state.tick), "event", true);
    nextState = {
      ...nextState,
      focusCharacterId: milestoneTarget.id,
      apostleMessage: `使徒は ${milestoneTarget.name} が節目を迎えたことを告げています。いまは観察を続ける局面です。`,
    };
  }

  const routineTarget =
    state.tick > 0 && state.tick % ROUTINE_FLOW_INTERVAL === 0
      ? findAliveTarget(nextState.characters, nextState.focusCharacterId)
      : undefined;

  if (routineTarget) {
    nextState = applySummary(nextState, buildRoutineSummary(routineTarget, state.tick), "system", true);
    nextState = {
      ...nextState,
      focusCharacterId: routineTarget.id,
      apostleMessage: `使徒は ${routineTarget.name} の日常を報告しています。まだ介入する時ではありません。`,
    };
  }

  return nextState;
}

function reserveInterventionTarget(state: WorldState, event: WorldEvent): WorldState {
  return {
    ...state,
    characters: state.characters.map((character) => {
      if (character.id !== event.targetCharacterId) {
        return character;
      }

      if (event.trigger === "warning") {
        return {
          ...character,
          warningIssued: true,
        };
      }

      return character;
    }),
  };
}

function detectIntervention(state: WorldState): WorldEvent | null {
  if (isWithinStartupGrace(state.tick)) {
    return null;
  }

  if (state.tick - state.lastInterventionTick < INTERVENTION_COOLDOWN_TICKS) {
    return null;
  }

  const warningTarget = state.characters.find(
    (character) => character.alive && character.lifespanRemaining <= 1 && !character.warningIssued,
  );
  if (warningTarget) {
    return buildInterventionEvent(warningTarget, "warning", state.tick);
  }

  return null;
}

function resolveInterventionMessage(
  event: WorldEvent,
  intervention: InterventionKind,
  previousCharacter: Character,
  updatedCharacter: Character,
): string {
  if (intervention === "watch") {
    return `使徒は ${updatedCharacter.name} を静かに見守り、${event.title} を記録へ刻みました。観察記録 ${previousCharacter.notable.length} → ${updatedCharacter.notable.length}。`;
  }

  if (intervention === "bless") {
    const blessingDelta = updatedCharacter.blessings - previousCharacter.blessings;
    const lifespanDelta = updatedCharacter.lifespanRemaining - previousCharacter.lifespanRemaining;
    return `使徒は ${updatedCharacter.name} に加護を注ぎました。加護 ${previousCharacter.blessings} → ${updatedCharacter.blessings} (${blessingDelta >= 0 ? "+" : ""}${blessingDelta}) / 残寿命 ${previousCharacter.lifespanRemaining} → ${updatedCharacter.lifespanRemaining} (${lifespanDelta >= 0 ? "+" : ""}${lifespanDelta})。`;
  }

  return `使徒は ${updatedCharacter.name} に試練を与えました。試練 ${previousCharacter.trials} → ${updatedCharacter.trials} (+${updatedCharacter.trials - previousCharacter.trials})。`;
}

function applyIntervention(character: Character, event: WorldEvent, intervention: InterventionKind): Character {
  if (intervention === "watch") {
    return {
      ...character,
      notable: [...character.notable, `${event.title} を見届けた`].slice(-4),
    };
  }

  if (intervention === "bless") {
    return {
      ...character,
      blessings: character.blessings + 1,
      lifespanRemaining: event.trigger === "warning" ? character.lifespanRemaining + 1 : character.lifespanRemaining,
      warningIssued: event.trigger === "warning" ? false : character.warningIssued,
      notable: [...character.notable, "加護を受けた"].slice(-4),
    };
  }

  return {
    ...character,
    trials: character.trials + 1,
    notable: [...character.notable, "試練を受けた"].slice(-4),
  };
}

export function createInitialWorldState(): WorldState {
  return {
    phase: "observing",
    tick: 0,
    ageStep: 0,
    timeControl: "stopped",
    focusCharacterId: "aki",
    characters: buildCharacters(),
    activeEvent: null,
    latestEventSummary: createSummary(
      "notable",
      "manual",
      "観察は停止中です",
      "まずは低速か 1 tick 進行で箱庭を眺めてください。起動直後は保護時間があり、いきなり介入イベントは出ません。",
      "Aki",
      0,
    ),
    apostleMessage:
      "使徒は日輪と潮音の二つの血統を見守っています。いまは時間を止めたまま、神が観察を始めるのを待っています。",
    logs: [
      {
        id: "log-0",
        tone: "system",
        message: "PBI-001: 箱庭観察と重要イベント介入の最小ループを開始しました。",
      },
    ],
    logSerial: 0,
    lastInterventionTick: -INTERVENTION_COOLDOWN_TICKS,
  };
}

export function recoverStalledEventState(state: WorldState): WorldState {
  if (state.phase === "event" && !state.activeEvent) {
    const message = hasLivingCharacters(state.characters)
      ? "使徒は失われた兆しを閉じ、ふたたび観察へ戻りました。"
      : "使徒は世界の終わりを記録し、静観に戻りました。";

    return ensureObservingState(state, message, RECOVERY_LOG);
  }

  return state;
}

export function advanceWorld(state: WorldState): WorldState {
  if (state.phase === "event" && !state.activeEvent) {
    return recoverStalledEventState(state);
  }

  if (state.phase === "event") {
    return state;
  }

  if (!hasLivingCharacters(state.characters)) {
    return {
      ...state,
      timeControl: "stopped",
    };
  }

  let nextState = applyAging(state);
  nextState = resolveDeaths(nextState);

  if (!hasLivingCharacters(nextState.characters)) {
    return nextState;
  }

  nextState = applyNotableEvents(nextState);

  const nextEvent = detectIntervention(nextState);
  if (!nextEvent) {
    return nextState;
  }

  const reservedState = reserveInterventionTarget(nextState, nextEvent);

  return beginEvent(
    reservedState,
    nextEvent,
    `使徒は ${nextEvent.targetCharacterName} に起きた重要な分岐を読み取りました。ここだけ神の判断が必要です。`,
  );
}

export function setTimeControl(state: WorldState, timeControl: TimeControl): WorldState {
  if (state.phase === "event" || !hasLivingCharacters(state.characters)) {
    return {
      ...state,
      timeControl: "stopped",
    };
  }

  return {
    ...state,
    timeControl,
    apostleMessage:
      timeControl === "stopped"
        ? "使徒は時間を止め、いま見えている兆しを静かに読み解いています。"
        : `使徒は箱庭時間を ${timeControl === "slow" ? "低速" : "通常"} で流し始めました。`,
  };
}

export function stepWorld(state: WorldState): WorldState {
  if (state.phase === "event" || !hasLivingCharacters(state.characters)) {
    return state;
  }

  return advanceWorld({
    ...state,
    timeControl: "stopped",
    apostleMessage: "使徒は時間を 1 tick だけ進め、変化を読み上げています。",
  });
}

export function selectFocus(state: WorldState, characterId: string): WorldState {
  const target = getCharacterById(state.characters, characterId);
  if (!target) {
    return state;
  }

  if (!target.alive) {
    const nextState = pushLog(state, "system", `${target.name} はすでに死亡しているため、注目対象にはできません。`);
    return {
      ...nextState,
      apostleMessage: `使徒は ${target.name} ではなく、生きている個体へ視線を向けるべきだと告げています。`,
    };
  }

  return {
    ...state,
    focusCharacterId: target.id,
    apostleMessage: `使徒は ${target.name} に注目を切り替えました。${target.bloodlineName} の流れを観察しています。`,
  };
}

export function triggerManualEvent(state: WorldState): WorldState {
  if (state.phase === "event" && !state.activeEvent) {
    return recoverStalledEventState(state);
  }

  if (state.phase === "event") {
    return state;
  }

  const target = findAliveTarget(state.characters, state.focusCharacterId);
  if (!target) {
    return pushLog(state, "system", "手動イベントを起こせる生存者がいません。");
  }

  return beginEvent(
    state,
    buildInterventionEvent(target, "manual", state.tick + 1),
    `使徒は ${target.name} の周囲に人工の兆しを生み出しました。ここでは手動イベントを優先して確認できます。`,
  );
}

export function resolveActiveEvent(state: WorldState, intervention: InterventionKind): WorldState {
  if (!state.activeEvent) {
    return recoverStalledEventState(pushLog(state, "system", "いま解決すべきイベントはありません。"));
  }

  const target = getCharacterById(state.characters, state.activeEvent.targetCharacterId);
  if (!target) {
    return ensureObservingState(state, "使徒は対象を見失いました。", RECOVERY_LOG);
  }

  const resolvedTarget = applyIntervention(target, state.activeEvent, intervention);

  const updatedCharacters = state.characters.map((character) =>
    character.id === target.id ? resolvedTarget : character,
  );

  const resultMessage = resolveInterventionMessage(state.activeEvent, intervention, target, resolvedTarget);
  const summary = createSummary(
    "intervention",
    state.activeEvent.trigger,
    `${target.name} への介入が完了しました`,
    resultMessage,
    target.name,
    state.tick,
  );

  let nextState: WorldState = {
    ...state,
    phase: "observing",
    activeEvent: null,
    focusCharacterId: target.id,
    characters: updatedCharacters,
    apostleMessage: resultMessage,
    latestEventSummary: summary,
    lastInterventionTick: state.tick,
  };

  nextState = pushLog(nextState, "command", `${intervention.toUpperCase()} -> ${target.name}: ${resultMessage}`);

  return resolveDeaths(nextState);
}

export function submitCommand(state: WorldState, rawInput: string): WorldState {
  if (state.phase === "event") {
    const rescuedState = state.activeEvent ? state : recoverStalledEventState(state);
    const nextState = pushLog(
      rescuedState,
      "system",
      "イベント中の入力は無効です。モーダルの Watch / Bless / Test で解決してください。",
    );

    return {
      ...nextState,
      apostleMessage: rescuedState.activeEvent
        ? `使徒は、先に ${rescuedState.activeEvent.targetCharacterName} への判断を求めています。`
        : nextState.apostleMessage,
    };
  }

  const command = rawInput.trim();

  if (!command) {
    return pushLog(state, "system", "空の命令は世界に届きませんでした。");
  }

  const [verbRaw, ...rest] = command.split(/\s+/);
  const verb = verbRaw.toLowerCase();
  const targetName = rest.join(" ");

  if (!["watch", "bless", "test"].includes(verb)) {
    const nextState = pushLog(
      state,
      "system",
      `解釈できた命令は watch / bless / test だけです。受信: "${command}"`,
    );

    return {
      ...nextState,
      apostleMessage: "使徒は命令を聞き取りましたが、MVP の範囲外だと判断しました。",
    };
  }

  const target = targetName
    ? findCharacterByName(state.characters, targetName)
    : getCharacterById(state.characters, state.focusCharacterId);

  if (!target) {
    const nextState = pushLog(state, "system", `対象 "${targetName}" は見つかりませんでした。`);
    return {
      ...nextState,
      apostleMessage: "使徒は対象を探しましたが、該当する個体を見つけられませんでした。",
    };
  }

  if (!target.alive) {
    const nextState = pushLog(state, "system", `${target.name} はすでに動かぬ存在です。`);
    return {
      ...nextState,
      apostleMessage: `使徒は ${target.name} に呼びかけましたが、返事はありませんでした。`,
    };
  }

  const eventState = beginEvent(
    {
      ...state,
      focusCharacterId: target.id,
    },
    buildInterventionEvent(target, "manual", state.tick + 1),
    `使徒は命令 "${command}" を受け、${target.name} に向けて介入の場を整えました。`,
  );

  return pushLog(eventState, "command", `Command accepted: ${command}`);
}

export function getFocusedCharacter(state: WorldState): Character | undefined {
  const target = getCharacterById(state.characters, state.focusCharacterId);
  return target?.alive ? target : undefined;
}

export function getAliveCharacterCount(state: WorldState): number {
  return state.characters.filter((character) => character.alive).length;
}

export function getStartupProtectionRemaining(state: WorldState): number {
  return Math.max(0, STARTUP_GRACE_TICKS - state.tick);
}

export function getDayPhase(tick: number): DayPhase {
  return DAY_PHASES[Math.floor(tick / 2) % DAY_PHASES.length];
}

export function getSeason(tick: number): Season {
  return SEASONS[Math.floor(tick / 12) % SEASONS.length];
}

export function getBloodlineSummaries(characters: Character[]): BloodlineSummary[] {
  const summaryMap = new Map<string, BloodlineSummary>();

  for (const character of characters) {
    const existing = summaryMap.get(character.bloodlineId);

    if (existing) {
      existing.aliveCount += character.alive ? 1 : 0;
      existing.favoriteCount += character.favorite ? 1 : 0;
      existing.totalBlessings += character.blessings;
      existing.totalTrials += character.trials;
      continue;
    }

    summaryMap.set(character.bloodlineId, {
      id: character.bloodlineId,
      name: character.bloodlineName,
      aliveCount: character.alive ? 1 : 0,
      favoriteCount: character.favorite ? 1 : 0,
      totalBlessings: character.blessings,
      totalTrials: character.trials,
    });
  }

  return [...summaryMap.values()];
}
