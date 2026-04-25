import { useReducer } from "react";
import {
  advanceWorld,
  createInitialWorldState,
  recoverStalledEventState,
  resolveActiveEvent,
  selectFocus,
  setTimeControl,
  stepWorld,
  submitCommand,
  triggerManualEvent,
} from "../domain/world";
import type { InterventionKind, TimeControl, WorldState } from "../domain/types";

type AppAction =
  | { type: "tick" }
  | { type: "stepTick" }
  | { type: "setTimeControl"; timeControl: TimeControl }
  | { type: "selectFocus"; characterId: string }
  | { type: "triggerManualEvent" }
  | { type: "submitCommand"; input: string }
  | { type: "recoverEventPhase" }
  | { type: "resolveEvent"; intervention: InterventionKind };

function appReducer(state: WorldState, action: AppAction): WorldState {
  const safeState = recoverStalledEventState(state);

  switch (action.type) {
    case "tick":
      return advanceWorld(safeState);
    case "stepTick":
      return stepWorld(safeState);
    case "setTimeControl":
      return setTimeControl(safeState, action.timeControl);
    case "selectFocus":
      return selectFocus(safeState, action.characterId);
    case "triggerManualEvent":
      return triggerManualEvent(safeState);
    case "submitCommand":
      return submitCommand(safeState, action.input);
    case "recoverEventPhase":
      return recoverStalledEventState(safeState);
    case "resolveEvent":
      return resolveActiveEvent(safeState, action.intervention);
    default:
      return safeState;
  }
}

export function useAppState() {
  return useReducer(appReducer, undefined, createInitialWorldState);
}
