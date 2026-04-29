import { describe, expect, it } from "vitest";

import { createCharacterPassportV1 } from "./characterPassport";
import { createEmptyGrowth, createGrowthSourceTotals } from "./growth";
import { createBaseAttributes } from "./fivePhases";

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
  it("models faith as command interpretation rather than a raw success chance", () => {
    const passport = buildPassport();

    expect(passport.faith.value).toBe(82);
    expect(passport.faith.trustBand).toBe("devoted");
    expect(passport.faith.commandInterpretation).toBe("contextual");
    expect(passport.faith.hazardResponse).toBe("resolute");
    expect(passport.faith.autonomyAlignment).toBe("balanced");
  });

  it("keeps element and combatClass as independent passport values", () => {
    const passport = createCharacterPassportV1({
      ...buildPassport(),
      element: "wood",
      combatClass: "mage",
      baseAttributes: createBaseAttributes({
        vision: 1,
        power: 8,
        guard: 2,
        discipline: 3,
        flow: 4,
      }),
      skills: [
        {
          ...buildPassport().skills[0],
          element: "fire",
        },
      ],
      abilities: [
        {
          ...buildPassport().abilities[0],
          element: "water",
        },
      ],
    });

    expect(passport.element).toBe("wood");
    expect(passport.combatClass).toBe("mage");
    expect(passport.baseAttributes.power).toBe(8);
    expect(passport.skills[0]?.element).toBe("fire");
    expect(passport.abilities[0]?.element).toBe("water");
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
