import { useEffect, useState } from "react";
import { ApostlePanel } from "../features/apostle/ApostlePanel";
import { CommandConsole } from "../features/commands/CommandConsole";
import { EventModal } from "../features/events/EventModal";
import { FirstActionGuide } from "../features/onboarding/FirstActionGuide";
import { AdvancedCodexWorkspacePanel } from "../features/agentWorkspace/AdvancedCodexWorkspacePanel";
import { WorldViewport } from "../features/sandbox/WorldViewport";
import { TutorialGuideOverlay, type TutorialGuideStep } from "../features/tutorial/TutorialGuideOverlay";
import { VillagerReincarnationImportPanel } from "../features/villagerImport/VillagerReincarnationImportPanel";
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
    id: "observe-world",
    title: "まず箱庭そのものを見る",
    body: "ここが住民たちが暮らす箱庭です。新米神様は、まず全体を見てから代表キャラを選びます。",
    apostleLine: "最初は細かな操作より『ここが暮らしの舞台だ』と掴めれば十分です。次に代表キャラへ移ります。",
    targetLabel: "箱庭ビュー",
    targetAnchor: "sandbox-viewport",
    highlightPadding: 18,
    scrollBlock: "center",
  },
  {
    id: "choose-aki",
    title: "代表キャラに Aki を選ぶ",
    body: "いまは Aki を選ぶだけで大丈夫です。光っているカードだけが押せて、押すと次の案内へ進みます。",
    apostleLine: "最初の成功体験は Aki から始めます。ほかの場所は押せないので、このカードだけを選んでください。",
    targetLabel: "Aki のキャラカード",
    targetAnchor: "character-card-aki",
    advanceMode: "targetClick",
    scrollBlock: "center",
  },
  {
    id: "check-selection",
    title: "選んだ代表キャラをここで確認する",
    body: "選択中のキャラと次にできることは、この要約欄に集まります。Aki が選ばれていれば準備完了です。",
    apostleLine: "選んだ相手を見失わないための現在地です。ここを見てから Bless に進めば迷いません。",
    targetLabel: "選択中キャラの要約",
    targetAnchor: "selected-character-summary",
    scrollBlock: "center",
  },
  {
    id: "press-bless",
    title: "最後に Bless を押して助ける",
    body: "今回は Bless が正解当てではなく、Aki を良い方向へ支える一手です。光っている Bless ボタンだけを押してください。",
    apostleLine: "ここが最初の成功体験です。Bless を押したあとは、結果が出た時点でこの案内が自然に終わります。",
    targetLabel: "Bless ボタン",
    targetAnchor: "action-bless-button",
    advanceMode: "targetClick",
    waitForExternalCompletion: true,
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
  const tutorialBlessResolved = firstBlessTutorialCompleted || state.latestJudgement?.action === "bless";

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

      <TutorialGuideOverlay
        steps={APP_SHELL_TUTORIAL_STEPS}
        completedSignal={tutorialBlessResolved}
        suspended={state.phase === "event"}
      />

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

          <VillagerReincarnationImportPanel focusedCharacterName={focusedCharacter?.name} />

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
