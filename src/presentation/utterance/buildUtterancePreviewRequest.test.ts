import { describe, expect, it } from "vitest";
import type { Character, EventSummary, JudgementResult } from "../../domain/types";
import { buildUtterancePreviewRequest } from "./buildUtterancePreviewRequest";

const character: Character = {
  id: "ren",
  name: "Ren",
  bloodlineId: "fox",
  bloodlineName: "狐火",
  age: 17,
  lifespanRemaining: 2,
  role: "Support",
  element: "Water",
  yinYang: "Balanced",
  alive: true,
  favorite: false,
  blessings: 1,
  trials: 2,
  deathReason: null,
  notable: ["夜明けに小さな兆しを見た。", "試練の気配に気づいた。"],
  milestoneHistory: [],
  warningIssued: false,
  position: { x: 0, z: 0 },
};

const warningSummary: EventSummary = {
  layer: "intervention",
  trigger: "warning",
  title: "終わりの兆し",
  description: "Ren の寿命が尽きかけている。",
  targetCharacterName: "Ren",
  tick: 12,
};

describe("buildUtterancePreviewRequest", () => {
  it("builds a provider-neutral warning request from focused character and latest event", () => {
    const request = buildUtterancePreviewRequest({
      character,
      latestEventSummary: warningSummary,
      latestJudgement: null,
      tick: 12,
    });

    expect(request).toMatchObject({
      requestId: "limited-ui-12-ren",
      character: {
        id: "ren",
        name: "Ren",
        growthSummary: "notable 2 件",
      },
      situation: {
        eventKind: "warning",
        eventSummary: "Ren の寿命が尽きかけている。",
        worldSummary: "tick 12 の箱庭状態",
      },
      constraints: {
        maxLength: 80,
        language: "ja",
        mode: "safe",
      },
    });
  });

  it("uses the latest judgement action for Bless/Test preview context", () => {
    const latestJudgement: JudgementResult = {
      action: "test",
      targetCharacterName: "Ren",
      formula: "1d20 + 1",
      roll: 15,
      modifier: 1,
      total: 16,
      rank: "success",
      effect: "試練を越えて勢いを得た。",
      sideEffect: null,
      changes: [{ label: "Momentum", before: 0, after: 1 }],
      tick: 13,
    };

    const request = buildUtterancePreviewRequest({
      character,
      latestEventSummary: warningSummary,
      latestJudgement,
      tick: 13,
    });

    expect(request.situation.eventKind).toBe("test");
    expect(request.situation.eventSummary).toContain("Test 結果");
    expect(request.situation.eventSummary).toContain("試練を越えて勢いを得た。");
  });
});
