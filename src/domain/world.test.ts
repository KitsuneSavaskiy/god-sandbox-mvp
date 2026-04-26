import { describe, expect, it } from "vitest";
import {
  advanceWorld,
  createInitialWorldState,
  previewJudgement,
  resolveActiveEvent,
} from "./world";

function getCharacter(state: ReturnType<typeof createInitialWorldState>, id: string) {
  const character = state.characters.find((entry) => entry.id === id);
  expect(character).toBeDefined();
  return character!;
}

function advanceTicks(state: ReturnType<typeof createInitialWorldState>, count: number) {
  let nextState = state;

  for (let index = 0; index < count; index += 1) {
    nextState = advanceWorld(nextState);
  }

  return nextState;
}

describe("world intervention characterization", () => {
  it("creates the expected initial state", () => {
    const state = createInitialWorldState();
    const ren = getCharacter(state, "ren");

    expect(state.tick).toBe(0);
    expect(state.phase).toBe("observing");
    expect(state.timeControl).toBe("stopped");
    expect(state.lastInterventionTick).toBe(-15);
    expect(state.activeEvent).toBeNull();
    expect(ren.lifespanRemaining).toBe(2);
    expect(ren.warningIssued).toBe(false);
  });

  it("keeps Ren protected through ticks 4 and 8 during startup grace", () => {
    const tick4 = advanceTicks(createInitialWorldState(), 4);
    const renAt4 = getCharacter(tick4, "ren");

    expect(tick4.tick).toBe(4);
    expect(tick4.phase).toBe("observing");
    expect(tick4.activeEvent).toBeNull();
    expect(renAt4.lifespanRemaining).toBe(2);
    expect(renAt4.warningIssued).toBe(false);

    const tick8 = advanceTicks(createInitialWorldState(), 8);
    const renAt8 = getCharacter(tick8, "ren");

    expect(tick8.tick).toBe(8);
    expect(tick8.phase).toBe("observing");
    expect(tick8.activeEvent).toBeNull();
    expect(renAt8.lifespanRemaining).toBe(2);
    expect(renAt8.warningIssued).toBe(false);
  });

  it("raises Ren warning at tick 12", () => {
    const state = advanceTicks(createInitialWorldState(), 12);
    const ren = getCharacter(state, "ren");

    expect(state.tick).toBe(12);
    expect(state.phase).toBe("event");
    expect(state.activeEvent?.trigger).toBe("warning");
    expect(state.activeEvent?.targetCharacterId).toBe("ren");
    expect(state.focusCharacterId).toBe("ren");
    expect(ren.lifespanRemaining).toBe(1);
    expect(ren.warningIssued).toBe(true);
  });

  it("applies cooldown after resolving an intervention", () => {
    const warningState = advanceTicks(createInitialWorldState(), 12);
    const renAtWarning = getCharacter(warningState, "ren");
    const blessJudgement = previewJudgement(
      renAtWarning,
      "bless",
      warningState.tick,
      "warning",
      warningState.momentum,
      11,
    );

    const resolvedState = resolveActiveEvent(warningState, "bless", blessJudgement);
    const cooldownProbe = {
      ...resolvedState,
      characters: resolvedState.characters.map((character) =>
        character.id === "ren"
          ? {
              ...character,
              lifespanRemaining: 1,
              warningIssued: false,
            }
          : character,
      ),
    };

    const nextTick = advanceWorld(cooldownProbe);

    expect(resolvedState.phase).toBe("observing");
    expect(resolvedState.activeEvent).toBeNull();
    expect(resolvedState.lastInterventionTick).toBe(12);
    expect(nextTick.tick).toBe(13);
    expect(nextTick.phase).toBe("observing");
    expect(nextTick.activeEvent).toBeNull();
  });

  it("stops the world when everyone dies", () => {
    const initial = createInitialWorldState();
    const collapseState = {
      ...initial,
      tick: 11,
      timeControl: "normal" as const,
      characters: initial.characters.map((character) => ({
        ...character,
        alive: true,
        lifespanRemaining: 1,
        warningIssued: false,
      })),
    };

    const nextState = advanceWorld(collapseState);

    expect(nextState.tick).toBe(12);
    expect(nextState.phase).toBe("observing");
    expect(nextState.timeControl).toBe("stopped");
    expect(nextState.activeEvent).toBeNull();
    expect(nextState.characters.every((character) => !character.alive)).toBe(true);
  });
});
