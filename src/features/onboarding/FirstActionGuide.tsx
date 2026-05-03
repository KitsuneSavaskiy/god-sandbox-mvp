import { useEffect, useState } from "react";
import type { Character, WorldEvent } from "../../domain/types";
import "./FirstActionGuide.css";

const TUTORIAL_DISMISSED_KEY = "godsandbox.apostleTutorialGuide.dismissed.v1";

function readTutorialDismissed() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(TUTORIAL_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

function writeTutorialDismissed() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(TUTORIAL_DISMISSED_KEY, "true");
  } catch {
    // 保存できない環境でも案内自体は使えるため、次回再表示だけ許容します。
  }
}

interface FirstActionGuideProps {
  activeEvent: WorldEvent | null;
  firstBlessTutorialCompleted: boolean;
  focusedCharacter?: Character;
  hasLivingCharacters: boolean;
  phase: "observing" | "event";
  timeControl: "stopped" | "slow" | "normal";
  onStepTick: () => void;
}

export function FirstActionGuide({
  activeEvent,
  firstBlessTutorialCompleted,
  focusedCharacter,
  hasLivingCharacters,
  phase,
  timeControl,
  onStepTick,
}: FirstActionGuideProps) {
  const isEventOpen = phase === "event";
  const tutorialBlessEvent = activeEvent?.tutorialKind === "firstBless";
  const canStep = hasLivingCharacters && !isEventOpen;
  const guide = getGuideState({
    blessSucceeded: firstBlessTutorialCompleted,
    focusedCharacterName: focusedCharacter?.name,
    hasLivingCharacters,
    isEventOpen,
    timeControl,
    tutorialBlessEvent,
  });
  const [isTutorialDismissed, setIsTutorialDismissed] = useState(readTutorialDismissed);

  useEffect(() => {
    if (!isTutorialDismissed) {
      return;
    }

    writeTutorialDismissed();
  }, [isTutorialDismissed]);

  return (
    <section
      className="first-action-guide"
      aria-labelledby="first-action-guide-title"
      data-tutorial-anchor="first-action-guide"
    >
      <div className="first-action-guide__copy">
        <p className="first-action-guide__eyebrow">使徒の案内</p>
        <h2 id="first-action-guide-title">ここはAIキャラが暮らす箱庭です</h2>
        <p>新米神様として世界を見守り、代表キャラを選んで必要な時だけ手を貸します。</p>
        {!isTutorialDismissed ? (
          <div className="first-action-guide__apostle" role="note" aria-label="使徒からの短い案内">
            <span className="first-action-guide__apostle-mark" aria-hidden="true">
              使徒
            </span>
            <p>{guide.apostleLine}</p>
            <button
              className="first-action-guide__dismiss"
              type="button"
              onClick={() => setIsTutorialDismissed(true)}
            >
              あとで見る
            </button>
          </div>
        ) : null}
      </div>

      <div
        className="first-action-guide__action-card first-action-guide__action-card--highlight"
        aria-label="次にすること"
        data-tutorial-anchor="first-action-cta-card"
      >
        <span className="first-action-guide__status">{guide.status}</span>
        {guide.stepAction === "step" ? (
          <button className="first-action-guide__cta" type="button" disabled={!canStep} onClick={onStepTick}>
            {guide.ctaLabel}
          </button>
        ) : (
          <div className="first-action-guide__cta first-action-guide__cta--notice">{guide.ctaLabel}</div>
        )}
        <p className="first-action-guide__hint">{guide.hint}</p>
        {firstBlessTutorialCompleted && focusedCharacter ? (
          <p className="first-action-guide__success-note">
            {focusedCharacter.name} に良い変化が起きました。余韻を見るには、少し時間を進めれば十分です。
          </p>
        ) : tutorialBlessEvent ? (
          <p className="first-action-guide__success-note">
            いま開いている出来事カードで Bless を押すと、最初の成功体験として良い変化を確認できます。
          </p>
        ) : null}
      </div>
    </section>
  );
}

function getGuideState({
  blessSucceeded,
  focusedCharacterName,
  hasLivingCharacters,
  isEventOpen,
  timeControl,
  tutorialBlessEvent,
}: {
  blessSucceeded: boolean;
  focusedCharacterName?: string;
  hasLivingCharacters: boolean;
  isEventOpen: boolean;
  timeControl: "stopped" | "slow" | "normal";
  tutorialBlessEvent: boolean;
}) {
  if (!hasLivingCharacters) {
    return {
      status: "現在地: キャラを準備中",
      ctaLabel: "キャラを準備中",
      hint: "キャラクターが現れたら、ここから観察を始められます。",
      apostleLine: "まずは箱庭にキャラが現れるのを待ちましょう。準備ができたら、次の一手を案内します。",
      stepAction: "notice" as const,
    };
  }

  if (tutorialBlessEvent) {
    return {
      status: "現在地: Bless を選ぶ場面",
      ctaLabel: "表示中の出来事カードで Bless を押す",
      hint: "今回は Bless で良い変化が起きるように整えています。出来事カードを読んで、そのまま Bless を押せば大丈夫です。",
      apostleLine: focusedCharacterName
        ? `${focusedCharacterName} を助ける場を整えました。ここでは Bless を選べば、良い方向へ動く感覚をつかめます。`
        : "助ける場を整えました。ここでは Bless を選べば、良い方向へ動く感覚をつかめます。",
      stepAction: "notice" as const,
    };
  }

  if (isEventOpen) {
    return {
      status: "現在地: 出来事が発生中",
      ctaLabel: "表示中の出来事カードを見る",
      hint: "起きた出来事カードで、キャラにどう関わるかを選びましょう。",
      apostleLine: "出来事が起きました。カードを見て、このキャラにどう関わるか選びましょう。",
      stepAction: "notice" as const,
    };
  }

  if (blessSucceeded) {
    return {
      status: "現在地: Bless の成功を確認済み",
      ctaLabel: timeControl === "stopped" ? "少し時間を進める" : "もう少し見守る",
      hint: "助けたあとの変化を追う時間です。箱庭を少し進めて、次の出来事を見てみましょう。",
      apostleLine: focusedCharacterName
        ? `${focusedCharacterName} には良い変化が起きました。次は少し見守って、その余韻を確かめましょう。`
        : "良い変化が起きました。次は少し見守って、その余韻を確かめましょう。",
      stepAction: "step" as const,
    };
  }

  return {
    status: focusedCharacterName ? "現在地: 代表キャラを選択済み" : "現在地: 代表キャラを選ぶ",
    ctaLabel: focusedCharacterName
      ? `${focusedCharacterName} を選べています。右の Bless ボタンを押します。`
      : "右の使徒パネルで代表キャラを選びます。",
    hint: "通常UIでは、右の使徒パネルで代表キャラを選び、Watch / Bless / Test から次の行動を決めます。",
    apostleLine: focusedCharacterName
      ? `まずは ${focusedCharacterName} を助けてみましょう。右の Bless ボタンが、最初の成功体験への近道です。`
      : "最初は1人だけ選べば大丈夫です。右の使徒パネルで代表キャラを選び、Bless へ進みましょう。",
    stepAction: "notice" as const,
  };
}
