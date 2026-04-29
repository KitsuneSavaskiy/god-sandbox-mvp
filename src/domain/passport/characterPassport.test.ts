import { describe, expect, it } from "vitest";

import { createCharacterPassportV1 } from "./characterPassport";
import { createEmptyGrowth, createGrowthSourceTotals } from "./growth";
import {
  BUFF_BY_ELEMENT,
  COMBAT_CLASS_BY_ELEMENT,
  DEBUFF_BY_ELEMENT,
  STATUS_CONDITION_BY_ELEMENT,
  createBaseAttributes,
} from "./fivePhases";

function buildPassport() {
  return createCharacterPassportV1({
    characterId: "aki-passport",
    name: "Aki",
    originGame: "god-sandbox-mvp",
    element: "wood",
    combatClass: "ranger",
    baseAttributes: createBaseAttributes({
      vision: 6,
      power: 2,
      guard: 3,
      discipline: 4,
      flow: 5,
    }),
    faith: {
      value: 82,
      obedienceBias: "disciplined",
      commandInterpretation: "contextual",
      hazardResponse: "resolute",
      autonomyAlignment: "balanced",
      sources: createGrowthSourceTotals({
        blessings: 3,
        trials: 1,
      }),
    },
    growth: createEmptyGrowth(),
    skills: [
      {
        kind: "skill",
        id: "thorn-trail",
        name: "Thorn Trail",
        element: "wood",
        skillType: "control",
        description: "枝の罠で敵の足を止める。",
        targetPattern: "line",
        range: 3,
        powerPerTile: 1,
        secondaryEffect: {
          type: "statusCondition",
          key: "rooted",
          duration: 1,
          target: "enemy",
        },
      },
    ],
    abilities: [
      {
        kind: "ability",
        id: "grove-oath",
        name: "Grove Oath",
        source: "trial",
        element: "wood",
        abilityType: "reaction",
        description: "拘束を受けた直後に姿勢を立て直す。",
        trigger: {
          type: "onStatusReceived",
          status: "rooted",
        },
        effects: [
          {
            type: "buff",
            key: "growth",
            value: 1,
            duration: 1,
            target: "self",
          },
        ],
      },
    ],
  });
}

describe("character passport domain", () => {
  it("keeps five-phase mappings aligned across class, status, buff, and debuff", () => {
    expect(COMBAT_CLASS_BY_ELEMENT.wood).toBe("ranger");
    expect(COMBAT_CLASS_BY_ELEMENT.water).toBe("healer");
    expect(STATUS_CONDITION_BY_ELEMENT.metal).toBe("sealed");
    expect(BUFF_BY_ELEMENT.earth).toBe("fortify");
    expect(DEBUFF_BY_ELEMENT.fire).toBe("overheated");
  });

  it("models faith as command interpretation rather than a raw success chance", () => {
    const passport = buildPassport();

    expect(passport.faith.value).toBe(82);
    expect(passport.faith.trustBand).toBe("devoted");
    expect(passport.faith.commandInterpretation).toBe("contextual");
    expect(passport.faith.hazardResponse).toBe("resolute");
    expect(passport.faith.autonomyAlignment).toBe("balanced");
  });

  it("rejects an element and combat class mismatch", () => {
    expect(() =>
      createCharacterPassportV1({
        ...buildPassport(),
        element: "wood",
        combatClass: "mage",
      }),
    ).toThrow(/Combat class mismatch/);
  });

  it("keeps skills and abilities as distinct boundaries in the passport", () => {
    const passport = buildPassport();

    expect(passport.skills[0]?.kind).toBe("skill");
    expect(passport.skills[0]?.secondaryEffect?.type).toBe("statusCondition");
    expect(passport.abilities[0]?.kind).toBe("ability");
    expect(passport.abilities[0]?.trigger.type).toBe("onStatusReceived");
    expect(passport.abilities[0]?.effects[0]?.type).toBe("buff");
  });
});
