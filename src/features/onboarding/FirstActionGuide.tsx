import "./FirstActionGuide.css";

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

  return (
    <section className="first-action-guide" aria-labelledby="first-action-guide-title">
      <div className="first-action-guide__copy">
        <p className="first-action-guide__eyebrow">まずはここから</p>
        <h2 id="first-action-guide-title">AIキャラを見守り、変化が起きたらどう関わるか選ぶゲームです</h2>
        <p>
          最初はむずかしい設定を覚えなくて大丈夫です。下の大きなボタンから、箱庭の時間を少しだけ進めましょう。
        </p>
      </div>

      <div className="first-action-guide__action-card" aria-label="次にすること">
        <span className="first-action-guide__status">{guide.status}</span>
        {isEventOpen ? (
          <div className="first-action-guide__cta first-action-guide__cta--notice">
            {guide.ctaLabel}
          </div>
        ) : (
          <button className="first-action-guide__cta" type="button" disabled={!canStep} onClick={onStepTick}>
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
    };
  }

  if (isEventOpen) {
    return {
      status: "現在地: 出来事が発生中",
      ctaLabel: "起きた出来事を見る",
      hint: "表示中の出来事カードで、キャラにどう関わるかを選びましょう。",
    };
  }

  if (tick === 0) {
    return {
      status: "現在地: 観察開始前",
      ctaLabel: "少し時間を進める",
      hint: "まずは一度だけ進めて、キャラの変化を見てみましょう。",
    };
  }

  if (timeControl === "stopped") {
    return {
      status: "現在地: 観察を一時停止中",
      ctaLabel: "少し時間を進める",
      hint: "もう一度だけ進めると、次の変化を確認できます。",
    };
  }

  return {
    status: "現在地: 観察中",
    ctaLabel: "変化を追う",
    hint: "自動で進んでいます。気になる変化が出たら、画面の案内に沿って選びます。",
  };
}
