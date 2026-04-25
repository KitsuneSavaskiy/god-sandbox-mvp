export type Element = "Wood" | "Fire" | "Earth" | "Metal" | "Water";

export type ClassRole = "Vanguard" | "Artillery" | "Support";

export type YinYangBias = "Yin" | "Balanced" | "Yang";

export type InterventionKind = "watch" | "bless" | "test";

export type EventTrigger = "routine" | "manual" | "milestone" | "warning" | "aging" | "death";

export type EventLayer = "flow" | "notable" | "intervention";

export type AppPhase = "observing" | "event";

export type TimeControl = "stopped" | "slow" | "normal";

export type DayPhase = "morning" | "noon" | "evening";

export type Season = "spring" | "summer" | "autumn" | "winter";

export interface CharacterPosition {
  x: number;
  z: number;
}

export interface Character {
  id: string;
  name: string;
  bloodlineId: string;
  bloodlineName: string;
  age: number;
  lifespanRemaining: number;
  role: ClassRole;
  element: Element;
  yinYang: YinYangBias;
  alive: boolean;
  favorite: boolean;
  blessings: number;
  trials: number;
  deathReason: string | null;
  notable: string[];
  milestoneHistory: number[];
  warningIssued: boolean;
  position: CharacterPosition;
}

export interface WorldEvent {
  id: string;
  title: string;
  description: string;
  trigger: EventTrigger;
  layer: EventLayer;
  targetCharacterId: string;
  targetCharacterName: string;
}

export interface EventSummary {
  layer: EventLayer;
  trigger: EventTrigger;
  title: string;
  description: string;
  targetCharacterName: string;
  tick: number;
}

export interface LogEntry {
  id: string;
  tone: "system" | "event" | "command";
  message: string;
}

export interface BloodlineSummary {
  id: string;
  name: string;
  aliveCount: number;
  favoriteCount: number;
  totalBlessings: number;
  totalTrials: number;
}

export interface WorldState {
  phase: AppPhase;
  tick: number;
  ageStep: number;
  timeControl: TimeControl;
  focusCharacterId: string;
  characters: Character[];
  activeEvent: WorldEvent | null;
  latestEventSummary: EventSummary | null;
  apostleMessage: string;
  logs: LogEntry[];
  logSerial: number;
  lastInterventionTick: number;
}
