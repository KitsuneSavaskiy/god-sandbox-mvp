import { useEffect, useState } from "react";
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
  hasLivingCharacters: boolean;
  phase: "observing" | "event";
  tick: number;
  timeControl: "stopped" | "slow" | "normal";
  onStepTick: () => void;
}

export function FirstActionGuide({
  hasLivingCharacters,
  phase,
  tick,
  timeControl,
  onStepTick,
}: FirstActionGuideProps) {
  const isEventOpen = phase === "event";
  const canStep = hasLivingCharacters && !isEventOpen;
  const guide = getGuideState({ hasLivingCharacters, isEventOpen, tick, timeControl });
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
        <p>
          神様として世界を見守り、変化が起きたらキャラにどう関わるかを選びます。
        </p>
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
        {isEventOpen ? (
          <div
            className="first-action-guide__cta first-action-guide__cta--notice"
            data-tutorial-anchor="first-action-cta"
          >
            {guide.ctaLabel}
          </div>
        ) : (
          <button
            className="first-action-guide__cta"
            type="button"
            disabled={!canStep}
            onClick={onStepTick}
            data-tutorial-anchor="first-action-cta"
          >
            {guide.ctaLabel}
          </button>
        )}
        <p className="first-action-guide__hint">{guide.hint}</p>
      </div>
    </section>
  );
}

function getGuideState({
  hasLivingCharacters,
  isEventOpen,
  tick,
  timeControl,
}: {
  hasLivingCharacters: boolean;
  isEventOpen: boolean;
  tick: number;
  timeControl: "stopped" | "slow" | "normal";
}) {
  if (!hasLivingCharacters) {
    return {
      status: "現在地: キャラを準備中",
      ctaLabel: "キャラを準備中",
      hint: "キャラクターが現れたら、ここから観察を始められます。",
      apostleLine: "まずは箱庭にキャラが現れるのを待ちましょう。準備ができたら、次の一手を案内します。",
    };
  }

  if (isEventOpen) {
    return {
      status: "現在地: 出来事が発生中",
      ctaLabel: "起きた出来事を見る",
      hint: "表示中の出来事カードで、キャラにどう関わるかを選びましょう。",
      apostleLine: "出来事が起きました。カードを見て、このキャラにどう関わるか選びましょう。",
    };
  }

  if (tick === 0) {
    return {
      status: "現在地: 観察開始前",
      ctaLabel: "少し時間を進める",
      hint: "まずは一度だけ進めて、キャラの変化を見てみましょう。",
      apostleLine: "最初に押すのは、この大きなボタンだけで大丈夫です。箱庭が少し動きます。",
    };
  }

  if (timeControl === "stopped") {
    return {
      status: "現在地: 観察を一時停止中",
      ctaLabel: "少し時間を進める",
      hint: "もう一度だけ進めると、次の変化を確認できます。",
      apostleLine: "よく見えました。もう少しだけ進めて、次の変化を追ってみましょう。",
    };
  }

  return {
    status: "現在地: 観察中",
    ctaLabel: "変化を追う",
    hint: "自動で進んでいます。気になる変化が出たら、画面の案内に沿って選びます。",
    apostleLine: "世界は動いています。大事な出来事が起きたら、私が知らせます。",
  };
}
