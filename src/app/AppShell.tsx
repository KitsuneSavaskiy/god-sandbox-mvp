import { useEffect, useState } from "react";
import { ApostlePanel } from "../features/apostle/ApostlePanel";
import { CommandConsole } from "../features/commands/CommandConsole";
import { EventModal } from "../features/events/EventModal";
import { FirstActionGuide } from "../features/onboarding/FirstActionGuide";
import { AdvancedCodexWorkspacePanel } from "../features/agentWorkspace/AdvancedCodexWorkspacePanel";
import { WorldViewport } from "../features/sandbox/WorldViewport";
import { TutorialGuideOverlay, type TutorialGuideStep } from "../features/tutorial/TutorialGuideOverlay";
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
import type { InterventionKind, JudgementResult } from "../domain/types";
import { useAppState } from "../state/appState";

interface AppShellProps {
  userName: string;
  onLogout: () => void;
}

const FIRST_BLESS_TUTORIAL_COMPLETED_KEY = "godsandbox.firstBlessTutorialCompleted.v1";

const UTTERANCE_PREVIEW_PROVIDERS = [
  { label: "mockProvider", provider: createMockProvider() },
  { label: "templateProvider", provider: createTemplateProvider() },
];

const APP_SHELL_TUTORIAL_STEPS: TutorialGuideStep[] = [
  {
    id: "observe-purpose",
    title: "ここで何をするゲームかを見る",
    body: "最初は、この案内カードで自分の現在地を確認します。新米神様として、箱庭の変化を見守る入口です。",
    apostleLine: "まずは『自分は何を見る役か』を短く掴みましょう。ここが毎回の導線になります。",
    targetLabel: "使徒の案内カード",
    targetSelector: '[data-tutorial-anchor=\"first-action-guide\"]',
    scrollBlock: "center",
  },
  {
    id: "observe-world",
    title: "箱庭そのものを見る",
    body: "ここが住民たちが暮らす箱庭です。ドラッグしながら、誰がどこで動いているかを観察します。",
    apostleLine: "大きな変化に気づく前に、まずは世界全体の様子を目で追ってみてください。",
    targetLabel: "箱庭ビュー",
    targetSelector: '[data-tutorial-anchor=\"world-viewport\"]',
    highlightPadding: 18,
    scrollBlock: "center",
  },
  {
    id: "observe-next-action",
    title: "代表キャラを選び、Bless を押す",
    body: "右側の使徒パネルで代表キャラを選び、Bless を押すと最初の成功体験へ進めます。",
    apostleLine: "最初は Watch や Test に迷わなくて大丈夫です。まずは Bless で助ける流れを見てみましょう。",
    targetLabel: "使徒パネルの Bless ボタン",
    targetSelector: '[data-tutorial-anchor=\"action-bless-button\"]',
    scrollBlock: "center",
  },
  {
    id: "observe-apostle-panel",
    title: "変化を読む場所を確認する",
    body: "使徒のメモや注目キャラの情報は、この右側パネルに集まります。Bless の結果も、ここで短く振り返れます。",
    apostleLine: "何が起きたか、誰を見ればよいかは、このパネルを起点に伝えます。",
    targetLabel: "使徒パネル",
    targetSelector: '[data-tutorial-anchor=\"apostle-panel\"]',
    highlightPadding: 16,
    scrollBlock: "center",
  },
];

function hasBlessSuccess(judgement: JudgementResult | null) {
  return (
    judgement?.action === "bless" &&
    (judgement.rank === "success" || judgement.rank === "greatSuccess" || judgement.rank === "critical")
  );
}

function readFirstBlessTutorialCompleted() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(FIRST_BLESS_TUTORIAL_COMPLETED_KEY) === "true";
  } catch {
    return false;
  }
}

function writeFirstBlessTutorialCompleted() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(FIRST_BLESS_TUTORIAL_COMPLETED_KEY, "true");
  } catch {
    // localStorage が使えない環境では、セッション中の state だけで完了状態を保持します。
  }
}

export function AppShell({ userName, onLogout }: AppShellProps) {
  const [state, dispatch] = useAppState();
  const [firstBlessTutorialCompleted, setFirstBlessTutorialCompleted] = useState(readFirstBlessTutorialCompleted);
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

  useEffect(() => {
    if (firstBlessTutorialCompleted || !hasBlessSuccess(state.latestJudgement)) {
      return;
    }

    setFirstBlessTutorialCompleted(true);
    writeFirstBlessTutorialCompleted();
  }, [firstBlessTutorialCompleted, state.latestJudgement]);

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
    if (intervention === "bless" && state.phase !== "event" && !firstBlessTutorialCompleted) {
      dispatch({ type: "submitCommand", input: `tutorial-bless ${characterName}` });
      return;
    }

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
        <div className="top-bar__controls" data-tutorial-anchor="time-controls">
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
        activeEvent={state.activeEvent}
        firstBlessTutorialCompleted={firstBlessTutorialCompleted}
        focusedCharacter={focusedCharacter}
        hasLivingCharacters={hasLivingCharacters}
        phase={state.phase}
        timeControl={state.timeControl}
        onStepTick={() => dispatch({ type: "stepTick" })}
      />

      <TutorialGuideOverlay steps={APP_SHELL_TUTORIAL_STEPS} suspended={state.phase === "event"} />

      <main className="main-layout">
        <section className="viewport-panel" data-tutorial-anchor="world-viewport">
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
          <div data-tutorial-anchor="apostle-panel">
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
          </div>

          <UtterancePreviewPanel
            disabled={!hasLivingCharacters}
            focusedCharacter={focusedCharacter}
            onGenerate={handleGenerateUtterancePreview}
          />

          <PassportExportPanel focusedCharacter={focusedCharacter} />

          <AdvancedCodexWorkspacePanel focusedCharacter={focusedCharacter} />

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
