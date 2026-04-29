import { describe, expect, it } from "vitest";
import type { Character, EventSummary, JudgementResult } from "../../domain/types";
import type { LlmProvider } from "./types";
import {
  buildUtteranceRequest,
  generateUtterancePreview,
} from "./generateUtterancePreview";

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

describe("utterance preview application use case", () => {
  it("builds a provider-neutral warning request from focused character and latest event", () => {
    const request = buildUtteranceRequest({
      character,
      latestEventSummary: warningSummary,
      latestJudgement: null,
      tick: 12,
    });

    expect(request).toMatchObject({
      requestId: "utterance-preview-12-ren",
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

    const request = buildUtteranceRequest({
      character,
      latestEventSummary: warningSummary,
      latestJudgement,
      tick: 13,
    });

    expect(request.situation.eventKind).toBe("test");
    expect(request.situation.eventSummary).toContain("Test 結果");
    expect(request.situation.eventSummary).toContain("試練を越えて勢いを得た。");
  });

  it("runs preview providers through the LlmProvider port without provider-specific data", async () => {
    const provider: LlmProvider = {
      kind: "mock",
      async generate(request) {
        expect(request.requestId).toBe("utterance-preview-12-ren");
        expect(JSON.stringify(request)).not.toContain("apiKey");
        expect(JSON.stringify(request)).not.toContain("userSecret");

        return {
          status: "ok",
          providerKind: "mock",
          text: `${request.character.name} は静かに応えた。`,
        };
      },
    };

    await expect(
      generateUtterancePreview({
        providers: [{ label: "mockProvider", provider }],
        character,
        latestEventSummary: warningSummary,
        latestJudgement: null,
        tick: 12,
      }),
    ).resolves.toEqual([
      {
        providerLabel: "mockProvider",
        status: "ok",
        text: "Ren は静かに応えた。",
        reason: undefined,
      },
    ]);
  });
});
