import type { UtteranceEventKind, UtteranceRequest } from "../../application/utterance/types";
import type { Character, EventSummary, JudgementResult } from "../../domain/types";

interface BuildUtterancePreviewRequestInput {
  character: Character;
  latestEventSummary: EventSummary | null;
  latestJudgement: JudgementResult | null;
  tick: number;
}

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

export function buildUtterancePreviewRequest({
  character,
  latestEventSummary,
  latestJudgement,
  tick,
}: BuildUtterancePreviewRequestInput): UtteranceRequest {
  const eventSummary = latestJudgement
    ? `${latestJudgement.targetCharacterName} への ${latestJudgement.action === "bless" ? "Bless" : "Test"} 結果: ${latestJudgement.effect}`
    : latestEventSummary?.description;

  return {
    requestId: `limited-ui-${tick}-${character.id}`,
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
    constraints: {
      maxLength: 80,
      language: "ja",
      mode: "safe",
    },
  };
}
