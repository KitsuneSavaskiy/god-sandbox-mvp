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
  const guideStatus = getGuideStatus({ hasLivingCharacters, isEventOpen, tick, timeControl });

  return (
    <section className="first-action-guide" aria-labelledby="first-action-guide-title">
      <div className="first-action-guide__copy">
        <p className="first-action-guide__eyebrow">はじめての神様へ</p>
        <h2 id="first-action-guide-title">箱庭を見守り、重要イベントで運命に介入するゲームです</h2>
        <p>
          まずは時間を1 tick進めて、キャラクターたちの変化を観察します。
          大きな出来事が起きたら、神として加護や試練を選び、物語の流れを変えます。
        </p>
      </div>

      <div className="first-action-guide__action-card" aria-label="次にすること">
        <span className="first-action-guide__status">{guideStatus}</span>
        {isEventOpen ? (
          <div className="first-action-guide__cta first-action-guide__cta--notice">
            イベントで介入を選ぶ
          </div>
        ) : (
          <button className="first-action-guide__cta" type="button" disabled={!canStep} onClick={onStepTick}>
            まず1 tick進める
          </button>
        )}
        <p className="first-action-guide__hint">
          {isEventOpen
            ? "時間は止まっています。表示中のイベントで、キャラにどう関わるかを選びましょう。"
            : "慣れてきたら、上の「通常」で自動観察に切り替えられます。"}
        </p>
      </div>
    </section>
  );
}

function getGuideStatus({
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
    return "現在地: 生存者がいません";
  }

  if (isEventOpen) {
    return "現在地: 重要イベント発生中";
  }

  if (tick === 0) {
    return "現在地: 観察開始前";
  }

  if (timeControl === "stopped") {
    return `現在地: tick ${tick} / 停止中`;
  }

  return `現在地: tick ${tick} / 観察中`;
}
