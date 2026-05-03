import { useEffect } from "react";
import { ApostlePanel } from "../features/apostle/ApostlePanel";
import { CommandConsole } from "../features/commands/CommandConsole";
import { EventModal } from "../features/events/EventModal";
import { FirstActionGuide } from "../features/onboarding/FirstActionGuide";
import { WorldViewport } from "../features/sandbox/WorldViewport";
import { createMockProvider } from "../infrastructure/llm/mockProvider";
import { createTemplateProvider } from "../infrastructure/llm/templateProvider";
import {
  generateUtterancePreview as runUtterancePreviewUseCase,
  type UtterancePreviewResult,
} from "../application/utterance/generateUtterancePreview";
import {
  UtterancePreviewPanel,
} from "../presentation/utterance/UtterancePreviewPanel";
import { PassportExportPanel } from "../presentation/passport/PassportExportPanel";
import {
  getAliveCharacterCount,
  getBloodlineSummaries,
  getDayPhase,
  getFocusedCharacter,
  getSeason,
  getStartupProtectionRemaining,
} from "../domain/world";
import type { InterventionKind } from "../domain/types";
import { useAppState } from "../state/appState";

interface AppShellProps {
  userName: string;
  onLogout: () => void;
}

const UTTERANCE_PREVIEW_PROVIDERS = [
  { label: "mockProvider", provider: createMockProvider() },
  { label: "templateProvider", provider: createTemplateProvider() },
];

export function AppShell({ userName, onLogout }: AppShellProps) {
  const [state, dispatch] = useAppState();
  const focusedCharacter = getFocusedCharacter(state);
  const activeEventTarget = state.activeEvent
    ? state.characters.find((character) => character.id === state.activeEvent?.targetCharacterId)
    : undefined;
  const bloodlines = getBloodlineSummaries(state.characters);
  const aliveCharacterCount = getAliveCharacterCount(state);
  const hasLivingCharacters = aliveCharacterCount > 0;
  const protectionRemaining = getStartupProtectionRemaining(state);
  const dayPhase = getDayPhase(state.tick);
  const season = getSeason(state.tick);

  useEffect(() => {
    if (state.phase === "event" && !state.activeEvent) {
      dispatch({ type: "recoverEventPhase" });
    }
  }, [dispatch, state.activeEvent, state.phase]);

  useEffect(() => {
    if (state.phase !== "observing" || !hasLivingCharacters || state.timeControl === "stopped") {
      return undefined;
    }

    const intervalMs = state.timeControl === "slow" ? 2600 : 1600;
    const timerId = window.setInterval(() => {
      dispatch({ type: "tick" });
    }, intervalMs);

    return () => window.clearInterval(timerId);
  }, [dispatch, hasLivingCharacters, state.phase, state.timeControl]);

  async function handleGenerateUtterancePreview(): Promise<UtterancePreviewResult[]> {
    if (!focusedCharacter) {
      return [];
    }

    return runUtterancePreviewUseCase({
      providers: UTTERANCE_PREVIEW_PROVIDERS,
      character: focusedCharacter,
      latestEventSummary: state.latestEventSummary,
      latestJudgement: state.latestJudgement,
      tick: state.tick,
    });
  }

  function handleRequestCharacterAction(intervention: InterventionKind, characterName: string) {
    dispatch({ type: "submitCommand", input: `${intervention} ${characterName}` });
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">god sandbox mvp / PBI-001</p>
          <h1>箱庭観察と重要イベント介入</h1>
        </div>
        <div className="top-bar__stats">
          <span>tick {state.tick}</span>
          <span>生存 {aliveCharacterCount}</span>
          <span>年齢更新 {state.ageStep} 回</span>
          <span>
            巡り {dayPhase === "morning" ? "朝" : dayPhase === "noon" ? "昼" : "晩"} /{" "}
            {season === "spring"
              ? "春"
              : season === "summer"
                ? "夏"
                : season === "autumn"
                  ? "秋"
                  : "冬"}
          </span>
          <span>
            時間制御{" "}
            {state.timeControl === "stopped"
              ? "停止"
              : state.timeControl === "slow"
                ? "低速"
                : "通常"}
          </span>
          <span>
            {state.phase === "event"
              ? "時間停止中"
              : hasLivingCharacters
                ? "観察進行中"
                : "生存者なし"}
          </span>
        </div>
        <div className="top-bar__controls">
          <button
            className={`button button--ghost ${state.timeControl === "stopped" ? "button--active" : ""}`}
            disabled={state.phase === "event" || !hasLivingCharacters}
            onClick={() => dispatch({ type: "setTimeControl", timeControl: "stopped" })}
          >
            停止
          </button>
          <button
            className={`button button--ghost ${state.timeControl === "slow" ? "button--active" : ""}`}
            disabled={state.phase === "event" || !hasLivingCharacters}
            onClick={() => dispatch({ type: "setTimeControl", timeControl: "slow" })}
          >
            低速
          </button>
          <button
            className={`button button--ghost ${state.timeControl === "normal" ? "button--active" : ""}`}
            disabled={state.phase === "event" || !hasLivingCharacters}
            onClick={() => dispatch({ type: "setTimeControl", timeControl: "normal" })}
          >
            通常
          </button>
          <button
            className="button button--ghost"
            disabled={state.phase === "event" || !hasLivingCharacters}
            onClick={() => dispatch({ type: "stepTick" })}
          >
            1 tick
          </button>
        </div>
        <div className="top-bar__user">
          <span className="top-bar__user-name">見守る神: {userName}</span>
          <button className="button button--ghost" onClick={onLogout}>
            退出
          </button>
        </div>
      </header>

      <FirstActionGuide
        hasLivingCharacters={hasLivingCharacters}
        phase={state.phase}
        tick={state.tick}
        timeControl={state.timeControl}
        onStepTick={() => dispatch({ type: "stepTick" })}
      />

      <main className="main-layout">
        <section className="viewport-panel">
          <WorldViewport
            characters={state.characters}
            focusCharacterId={state.focusCharacterId}
            dayPhase={dayPhase}
            paused={state.phase === "event"}
            season={season}
            tick={state.tick}
          />
        </section>

        <aside className="sidebar">
          <ApostlePanel
            apostleMessage={state.apostleMessage}
            focusedCharacter={focusedCharacter}
            characters={state.characters}
            bloodlines={bloodlines}
            latestEventSummary={state.latestEventSummary}
            latestJudgement={state.latestJudgement}
            momentum={state.momentum}
            protectionRemaining={protectionRemaining}
            hasLivingCharacters={hasLivingCharacters}
            paused={state.phase === "event"}
            onSelectCharacter={(characterId) => dispatch({ type: "selectFocus", characterId })}
            onTriggerManualEvent={() => dispatch({ type: "triggerManualEvent" })}
            onRequestCharacterAction={handleRequestCharacterAction}
          />

          <UtterancePreviewPanel
            disabled={!hasLivingCharacters}
            focusedCharacter={focusedCharacter}
            onGenerate={handleGenerateUtterancePreview}
          />

          <PassportExportPanel focusedCharacter={focusedCharacter} />

          <CommandConsole
            disabled={state.phase === "event" || !hasLivingCharacters}
            logs={state.logs}
            onSubmit={(input) => dispatch({ type: "submitCommand", input })}
          />
        </aside>
      </main>

      <EventModal
        event={state.activeEvent}
        targetCharacter={activeEventTarget}
        tick={state.tick}
        momentum={state.momentum}
        onResolve={(intervention, judgement) => dispatch({ type: "resolveEvent", intervention, judgement })}
      />
    </div>
  );
}
