import type {
  BloodlineSummary,
  Character,
  DayPhase,
  EventSummary,
  EventTriggerCandidate,
  InterventionKind,
  JudgementResult,
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

export const NON_LIFESPAN_EVENT_TRIGGER_CANDIDATES: EventTriggerCandidate[] = [
  {
    id: "curiosity",
    label: "好奇心",
    description: "対象キャラが未知の場所や出来事へ意識を向ける兆し。",
    recommendedIntervention: "watch",
  },
  {
    id: "encounter",
    label: "出会い",
    description: "対象キャラが誰か、または何かと出会い、関係変化の入口に立つ兆し。",
    recommendedIntervention: "bless",
  },
  {
    id: "discoveryHint",
    label: "発見の気配",
    description: "まだ名前のない気配が観測され、新個体発見へつながり得る兆し。",
    recommendedIntervention: "watch",
  },
  {
    id: "environmentShift",
    label: "環境変化",
    description: "天候、季節、土地の変化がキャラの行動を変える兆し。",
    recommendedIntervention: "test",
  },
];

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

function getInterventionTriggerSummary(trigger: WorldEvent["trigger"], target: Character) {
  switch (trigger) {
    case "warning":
      return `発火条件: ${target.name} の残寿命が ${target.lifespanRemaining} となり、命運警告が立ちました。`;
    case "manual":
    default:
      return `発火条件: 神の命令で ${target.name} への手動イベントが呼び出されました。`;
  }
}

function getInterventionCauseSummary(trigger: WorldEvent["trigger"], target: Character) {
  const latestNotable = target.notable[target.notable.length - 1];

  switch (trigger) {
    case "warning":
      return latestNotable
        ? `直前の兆し: 「${latestNotable}」を抱えた ${target.name} の命火が限界に近づきました。`
        : `${target.name} の寿命低下が続き、介入が必要な臨界点に達しました。`;
    case "manual":
    default:
      return latestNotable
        ? `対象との関係: いま注目している ${target.name} は「${latestNotable}」の余韻を残しています。`
        : `対象との関係: いま注目している ${target.name} に、使徒が神託の場を整えました。`;
  }
}

function buildInterventionEvent(
  target: Character,
  trigger: "manual" | "warning",
  tick: number,
  presetIntervention?: InterventionKind,
): WorldEvent {
  return {
    id: `event-${tick}-${target.id}-${trigger}`,
    title: getInterventionTitle(trigger, target),
    description: getInterventionDescription(trigger, target),
    triggerSummary: getInterventionTriggerSummary(trigger, target),
    causeSummary: getInterventionCauseSummary(trigger, target),
    presetIntervention,
    trigger,
    layer: "intervention",
    targetCharacterId: target.id,
    targetCharacterName: target.name,
  };
}

function buildTutorialBlessEvent(target: Character, tick: number): WorldEvent {
  return {
    id: `event-${tick}-${target.id}-tutorial-first-bless`,
    title: `${target.name} に最初の加護を届けます`,
    description:
      `${target.name} が迷いながらも、神の声に気づきかけています。` +
      "ここでは Bless を選ぶと、初回チュートリアルとして確実に良い変化が起きます。",
    triggerSummary: "発火条件: 初回チュートリアル導線から、Bless の成功体験を確認するために呼び出されました。",
    causeSummary:
      "寿命危機ではなく、神の介入を学ぶための導入イベントです。対象キャラは小さな迷いの中で導きを待っています。",
    presetIntervention: "bless",
    tutorialKind: "firstBless",
    trigger: "manual",
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
    latestJudgement: null,
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

function clampLifespan(value: number) {
  return Math.max(0, value);
}

function appendNotable(character: Character, entry: string): Character {
  return {
    ...character,
    notable: [...character.notable, entry].slice(-4),
  };
}

export function getInterventionModifier(
  character: Character,
  intervention: "bless" | "test",
  momentum = 0,
) {
  let modifier = 0;

  if (intervention === "bless" && character.favorite) {
    modifier += 1;
  }

  if (intervention === "test" && character.notable.length >= 2) {
    modifier += 1;
  }

  if (intervention === "test") {
    modifier += Math.min(momentum, 2);
  }

  if (character.lifespanRemaining <= 1) {
    modifier -= 1;
  }

  return modifier;
}

export function rankJudgement(roll: number, total: number): JudgementResult["rank"] {
  if (roll === 1) {
    return "fumble";
  }

  if (roll === 20) {
    return "critical";
  }

  if (total >= 18) {
    return "greatSuccess";
  }

  if (total >= 11) {
    return "success";
  }

  return "failure";
}

export function getJudgementRankLabel(rank: JudgementResult["rank"]) {
  switch (rank) {
    case "critical":
      return "クリティカル";
    case "greatSuccess":
      return "大成功";
    case "success":
      return "成功";
    case "failure":
      return "失敗";
    case "fumble":
    default:
      return "ファンブル";
  }
}

export function previewJudgement(
  character: Character,
  intervention: "bless" | "test",
  tick: number,
  trigger: WorldEvent["trigger"],
  momentum: number,
  roll = Math.floor(Math.random() * 20) + 1,
): JudgementResult {
  return intervention === "bless"
    ? buildBlessJudgement(character, trigger, tick, roll)
    : buildTestJudgement(character, tick, momentum, roll);
}

function createJudgement(
  action: "bless" | "test",
  targetCharacterName: string,
  modifier: number,
  tick: number,
  roll = Math.floor(Math.random() * 20) + 1,
): JudgementResult {
  const total = roll + modifier;

  return {
    action,
    targetCharacterName,
    formula: `1d20 ${modifier >= 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`}`,
    roll,
    modifier,
    total,
    rank: rankJudgement(roll, total),
    effect: "",
    sideEffect: null,
    changes: [],
    tick,
  };
}

function buildBlessJudgement(
  character: Character,
  trigger: WorldEvent["trigger"],
  tick: number,
  roll?: number,
): JudgementResult {
  const judgement = createJudgement(
    "bless",
    character.name,
    getInterventionModifier(character, "bless"),
    tick,
    roll,
  );

  switch (judgement.rank) {
    case "critical":
      judgement.effect = "奇跡的な加護が降り、残寿命 +3 / 加護 +1。";
      break;
    case "greatSuccess":
      judgement.effect = "強い加護が届き、残寿命 +2 / 加護 +1。";
      break;
    case "success":
      judgement.effect = "加護がしっかり届き、残寿命 +2。";
      break;
    case "failure":
      judgement.effect = "祈りは届きましたが、はっきりした加護にはなりませんでした。";
      judgement.sideEffect = "変化はほとんど起きませんでした。";
      break;
    case "fumble":
    default:
      judgement.effect = "祈りが乱れ、命火がやや弱まりました。";
      judgement.sideEffect = "残寿命が 1 減少しました。";
      break;
  }

  judgement.changes = [
    {
      label: "加護",
      before: character.blessings,
      after:
        judgement.rank === "critical" || judgement.rank === "greatSuccess"
          ? character.blessings + 1
          : character.blessings,
    },
    {
      label: "残寿命",
      before: character.lifespanRemaining,
      after:
        judgement.rank === "critical"
          ? character.lifespanRemaining + 3
          : judgement.rank === "greatSuccess" || judgement.rank === "success"
            ? character.lifespanRemaining + 2
            : judgement.rank === "fumble"
              ? clampLifespan(character.lifespanRemaining - 1)
              : character.lifespanRemaining,
    },
  ];
  return judgement;
}

function buildTutorialBlessJudgement(character: Character, tick: number): JudgementResult {
  return buildBlessJudgement(character, "manual", tick, 12);
}

function buildTestJudgement(
  character: Character,
  tick: number,
  momentum: number,
  roll?: number,
): JudgementResult {
  const modifier = getInterventionModifier(character, "test", momentum);
  const judgement = createJudgement("test", character.name, modifier, tick, roll);
  const momentumReward =
    judgement.rank === "critical" ? 3 : judgement.rank === "greatSuccess" ? 2 : judgement.rank === "success" ? 1 : 0;

  switch (judgement.rank) {
    case "critical":
      judgement.effect = "試練 +2 / 加護 +1 / Momentum +3。危険を越えて大きく成長しました。";
      break;
    case "greatSuccess":
      judgement.effect = "試練 +2 / 加護 +1 / Momentum +2。危うい試練を糧に変えました。";
      break;
    case "success":
      judgement.effect = "試練 +1 / Momentum +1。危険を乗り切りました。";
      break;
    case "failure":
      judgement.effect = "試練 +1。代償は払いましたが、経験自体は残りました。";
      judgement.sideEffect = "試練 +1 と引き換えに、残寿命が 1 減少しました。";
      break;
    case "fumble":
    default:
      judgement.effect = "試練に打ちのめされ、大きくよろめきました。";
      judgement.sideEffect = "残寿命が 1 減少し、加護も 1 失いました。";
      break;
  }

  judgement.changes = [
    {
      label: "試練",
      before: character.trials,
      after:
        judgement.rank === "critical" || judgement.rank === "greatSuccess"
          ? character.trials + 2
          : judgement.rank === "success" || judgement.rank === "failure"
            ? character.trials + 1
            : character.trials,
    },
    {
      label: "残寿命",
      before: character.lifespanRemaining,
      after:
        judgement.rank === "failure" || judgement.rank === "fumble"
          ? clampLifespan(character.lifespanRemaining - 1)
          : character.lifespanRemaining,
    },
    {
      label: "加護",
      before: character.blessings,
      after:
        judgement.rank === "critical" || judgement.rank === "greatSuccess"
          ? character.blessings + 1
          : judgement.rank === "fumble"
            ? Math.max(0, character.blessings - 1)
            : character.blessings,
    },
    {
      label: "Momentum",
      before: momentum,
      after: momentum + momentumReward,
    },
  ];
  return judgement;
}

function applyBlessOutcome(
  character: Character,
  trigger: WorldEvent["trigger"],
  judgement: JudgementResult,
): Character {
  switch (judgement.rank) {
    case "critical":
      return appendNotable(
        {
          ...character,
          blessings: character.blessings + 1,
          lifespanRemaining: character.lifespanRemaining + 3,
          warningIssued: false,
        },
        "奇跡の加護が降りた",
      );
    case "greatSuccess":
      return appendNotable(
        {
          ...character,
          blessings: character.blessings + 1,
          lifespanRemaining: character.lifespanRemaining + 2,
          warningIssued: false,
        },
        "強い加護を受けた",
      );
    case "success":
      return appendNotable(
        {
          ...character,
          lifespanRemaining: character.lifespanRemaining + 2,
          warningIssued: trigger === "warning" ? false : character.warningIssued,
        },
        "加護が命火を支えた",
      );
    case "failure":
      return appendNotable(character, "祈りは届いたが形にならなかった");
    case "fumble":
    default:
      return appendNotable(
        {
          ...character,
          lifespanRemaining: clampLifespan(character.lifespanRemaining - 1),
        },
        "祈りが乱れた",
      );
  }
}

function applyTestOutcome(character: Character, judgement: JudgementResult): Character {
  switch (judgement.rank) {
    case "critical":
      return appendNotable(
        {
          ...character,
          trials: character.trials + 2,
          blessings: character.blessings + 1,
        },
        "試練を超越した",
      );
    case "greatSuccess":
      return appendNotable(
        {
          ...character,
          trials: character.trials + 2,
          blessings: character.blessings + 1,
        },
        "試練を乗り越えた",
      );
    case "success":
      return appendNotable(
        {
          ...character,
          trials: character.trials + 1,
        },
        "試練を受け止めた",
      );
    case "failure":
      return appendNotable(
        {
          ...character,
          trials: character.trials + 1,
          lifespanRemaining: clampLifespan(character.lifespanRemaining - 1),
        },
        "試練に揺らいだ",
      );
    case "fumble":
    default:
      return appendNotable(
        {
          ...character,
          lifespanRemaining: clampLifespan(character.lifespanRemaining - 1),
          blessings: Math.max(0, character.blessings - 1),
        },
        "試練に打ちのめされた",
      );
  }
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
    return `使徒は ${updatedCharacter.name} を静かに見守り、${event.title} の兆しを見抜きました。notable ${previousCharacter.notable.length} → ${updatedCharacter.notable.length}。notable が 2 件以上あると次の Test が少し有利になります。`;
  }

  if (intervention === "bless") {
    const blessingDelta = updatedCharacter.blessings - previousCharacter.blessings;
    const lifespanDelta = updatedCharacter.lifespanRemaining - previousCharacter.lifespanRemaining;
    return `使徒は ${updatedCharacter.name} に加護を注ぎました。加護 ${previousCharacter.blessings} → ${updatedCharacter.blessings} (${blessingDelta >= 0 ? "+" : ""}${blessingDelta}) / 残寿命 ${previousCharacter.lifespanRemaining} → ${updatedCharacter.lifespanRemaining} (${lifespanDelta >= 0 ? "+" : ""}${lifespanDelta})。`;
  }

  return `使徒は ${updatedCharacter.name} に試練を与えました。試練 ${previousCharacter.trials} → ${updatedCharacter.trials} (+${updatedCharacter.trials - previousCharacter.trials})。`;
}

function applyWatchIntervention(character: Character, event: WorldEvent): Character {
  const observedNote =
    event.trigger === "warning" ? "命火の揺らぎを見抜いた" : `${event.title} を見届けた`;

  return appendNotable(
    character,
    observedNote,
  );
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
    latestJudgement: null,
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
    momentum: 0,
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

export function triggerTutorialBlessEvent(state: WorldState, targetCharacterId = state.focusCharacterId): WorldState {
  if (state.phase === "event" && !state.activeEvent) {
    return recoverStalledEventState(state);
  }

  if (state.phase === "event") {
    return state;
  }

  const target = findAliveTarget(state.characters, targetCharacterId);
  if (!target) {
    return pushLog(state, "system", "チュートリアルイベントを起こせる生存者がいません。");
  }

  return beginEvent(
    {
      ...state,
      focusCharacterId: target.id,
    },
    buildTutorialBlessEvent(target, state.tick + 1),
    `使徒は ${target.name} に初めての加護を届ける場を整えました。まずは Bless を選ぶと、良い変化を確認できます。`,
  );
}

export function resolveActiveEvent(
  state: WorldState,
  intervention: InterventionKind,
  precomputedJudgement?: JudgementResult,
): WorldState {
  if (!state.activeEvent) {
    return recoverStalledEventState(pushLog(state, "system", "いま解決すべきイベントはありません。"));
  }

  const target = getCharacterById(state.characters, state.activeEvent.targetCharacterId);
  if (!target) {
    return ensureObservingState(state, "使徒は対象を見失いました。", RECOVERY_LOG);
  }

  const judgementResult =
    intervention === "bless" || intervention === "test"
      ? state.activeEvent.tutorialKind === "firstBless" && intervention === "bless"
        ? buildTutorialBlessJudgement(target, state.tick)
        : precomputedJudgement && precomputedJudgement.action === intervention
          ? precomputedJudgement
          : previewJudgement(target, intervention, state.tick, state.activeEvent.trigger, state.momentum)
      : null;

  const resolvedTarget =
    intervention === "watch"
      ? applyWatchIntervention(target, state.activeEvent)
      : intervention === "bless"
        ? applyBlessOutcome(target, state.activeEvent.trigger, judgementResult!)
        : applyTestOutcome(target, judgementResult!);

  const updatedCharacters = state.characters.map((character) =>
    character.id === target.id ? resolvedTarget : character,
  );

  const resultMessage =
    intervention === "watch"
      ? resolveInterventionMessage(state.activeEvent, intervention, target, resolvedTarget)
      : `式神は ${target.name} への ${intervention === "bless" ? "Bless" : "Test"} を ${getJudgementRankLabel(
          judgementResult!.rank,
        )} と裁定しました。${judgementResult!.effect}`;
  const nextMomentum = judgementResult?.changes.find((change) => change.label === "Momentum")?.after ?? state.momentum;
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
    latestJudgement: judgementResult ?? null,
    lastInterventionTick: state.tick,
    momentum: nextMomentum,
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
  const tutorialBlessCommand = verb === "tutorial-bless";

  if (!["watch", "bless", "test", "tutorial-bless"].includes(verb)) {
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

  if (tutorialBlessCommand) {
    const tutorialState = triggerTutorialBlessEvent(
      {
        ...state,
        focusCharacterId: target.id,
      },
      target.id,
    );

    return pushLog(tutorialState, "command", `Command accepted: ${command}`);
  }

  if (targetName && verb === "watch") {
    const eventState = beginEvent(
      {
        ...state,
        focusCharacterId: target.id,
      },
      buildInterventionEvent(target, "manual", state.tick + 1, "watch"),
      `使徒は命令 "${command}" を受け、${target.name} をただちに見守りました。`,
    );

    return resolveActiveEvent(
      pushLog(eventState, "command", `Command accepted: ${command}`),
      "watch",
    );
  }

  const eventState = beginEvent(
    {
      ...state,
      focusCharacterId: target.id,
    },
    buildInterventionEvent(
      target,
      "manual",
      state.tick + 1,
      targetName && (verb === "bless" || verb === "test") ? (verb as InterventionKind) : undefined,
    ),
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
