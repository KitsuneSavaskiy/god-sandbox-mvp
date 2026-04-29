import type { Character, EventSummary, JudgementResult } from "../../domain/types";
import type {
  LlmProvider,
  UtteranceCharacterContext,
  UtteranceConstraints,
  UtteranceEventKind,
  UtteranceRequest,
  UtteranceResponseStatus,
  UtteranceSituationContext,
} from "./types";

export interface BuildUtteranceContextInput {
  character: Character;
  latestEventSummary: EventSummary | null;
  latestJudgement: JudgementResult | null;
  tick: number;
}

export interface BuildUtteranceRequestInput extends BuildUtteranceContextInput {
  constraints?: UtteranceConstraints;
  requestIdPrefix?: string;
}

export interface UtterancePreviewProvider {
  label: string;
  provider: LlmProvider;
}

export interface UtterancePreviewResult {
  providerLabel: string;
  status: UtteranceResponseStatus;
  text: string | null;
  reason?: string;
}

export interface GenerateUtterancePreviewInput extends BuildUtteranceRequestInput {
  providers: UtterancePreviewProvider[];
}

const DEFAULT_CONSTRAINTS: UtteranceConstraints = {
  maxLength: 80,
  language: "ja",
  mode: "safe",
};

function mapEventKind(
  latestEventSummary: EventSummary | null,
  latestJudgement: JudgementResult | null,
): UtteranceEventKind {
  if (latestJudgement) {
    return latestJudgement.action;
  }

  switch (latestEventSummary?.trigger) {
    case "manual":
      return "manual";
    case "routine":
      return "routine";
    case "warning":
      return "warning";
    default:
      return "unknown";
  }
}

function buildStatusSummary(character: Character) {
  if (!character.alive) {
    return character.deathReason ? `死亡: ${character.deathReason}` : "死亡";
  }

  return `年齢 ${character.age} / 残寿命 ${character.lifespanRemaining} / 加護 ${character.blessings} / 試練 ${character.trials}`;
}

export function buildUtteranceContext({
  character,
  latestEventSummary,
  latestJudgement,
  tick,
}: BuildUtteranceContextInput): {
  character: UtteranceCharacterContext;
  situation: UtteranceSituationContext;
} {
  const eventSummary = latestJudgement
    ? `${latestJudgement.targetCharacterName} への ${latestJudgement.action === "bless" ? "Bless" : "Test"} 結果: ${latestJudgement.effect}`
    : latestEventSummary?.description;

  return {
    character: {
      id: character.id,
      name: character.name,
      faithSummary: "信仰度の詳細値はまだ UI 連携していないため、現在は箱庭の観察状態だけを渡す。",
      growthSummary: `notable ${character.notable.length} 件`,
      statusSummary: buildStatusSummary(character),
    },
    situation: {
      eventKind: mapEventKind(latestEventSummary, latestJudgement),
      eventSummary,
      worldSummary: `tick ${tick} の箱庭状態`,
    },
  };
}

export function buildUtteranceRequest({
  character,
  latestEventSummary,
  latestJudgement,
  tick,
  constraints = DEFAULT_CONSTRAINTS,
  requestIdPrefix = "utterance-preview",
}: BuildUtteranceRequestInput): UtteranceRequest {
  const context = buildUtteranceContext({
    character,
    latestEventSummary,
    latestJudgement,
    tick,
  });

  return {
    requestId: `${requestIdPrefix}-${tick}-${character.id}`,
    ...context,
    constraints,
  };
}

export async function generateUtterancePreview({
  providers,
  ...requestInput
}: GenerateUtterancePreviewInput): Promise<UtterancePreviewResult[]> {
  const request = buildUtteranceRequest(requestInput);
  const responses = await Promise.all(
    providers.map(async ({ label, provider }) => ({
      label,
      response: await provider.generate(request),
    })),
  );

  return responses.map(({ label, response }) => ({
    providerLabel: label,
    status: response.status,
    text: response.text,
    reason: response.reason,
  }));
}
