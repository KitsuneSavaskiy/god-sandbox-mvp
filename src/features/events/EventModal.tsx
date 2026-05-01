import { useEffect, useRef, useState } from "react";
import { RYO_ILLUSTRATIONS, RYO_PORTRAITS } from "../../assets/artPaths";
import { getInterventionModifier, getJudgementRankLabel, previewJudgement } from "../../domain/world";
import type { Character, InterventionKind, JudgementResult, WorldEvent } from "../../domain/types";
import "./EventModalDecisionGuide.css";

interface EventModalProps {
  event: WorldEvent | null;
  tick: number;
  momentum: number;
  targetCharacter?: Character;
  onResolve: (intervention: InterventionKind, judgement?: JudgementResult) => void;
}

const interventions: InterventionKind[] = ["watch", "bless", "test"];

const labels: Record<InterventionKind, string> = {
  watch: "Watch",
  bless: "Bless",
  test: "Test",
};

const triggerLabels: Record<WorldEvent["trigger"], string> = {
  routine: "流しイベント",
  manual: "手動イベント",
  milestone: "節目",
  warning: "警告",
  aging: "流しイベント",
  death: "死亡",
};

interface RollingState {
  intervention: "bless" | "test";
  judgement: JudgementResult;
  revealed: boolean;
}

interface DecisionGuideOption {
  intervention: InterventionKind;
  summary: string;
  detail: string;
  context: string;
}

function buildRollingState(
  targetCharacter: Character,
  event: WorldEvent,
  tick: number,
  momentum: number,
  intervention: "bless" | "test",
  roll: number,
  revealed = false,
): RollingState {
  return {
    intervention,
    judgement: previewJudgement(targetCharacter, intervention, tick, event.trigger, momentum, roll),
    revealed,
  };
}

function getEventArtGuide(event: WorldEvent, targetCharacter?: Character) {
  const subjectName = targetCharacter?.name ?? event.targetCharacterName;

  switch (event.trigger) {
    case "warning":
      return {
        portraitLine: `表示対象: ${subjectName} / 危機前表情を表示`,
        illustrationLine: "Ryo 基準の感情挿絵を後差しするための仮枠",
        shotLine: "推奨構図: 顔寄り + 背景の不穏",
      };
    case "manual":
    default:
      return {
        portraitLine: `表示対象: ${subjectName} / 受け止め表情を表示`,
        illustrationLine: "Ryo 基準のイベント挿絵を後差しするための仮枠",
        shotLine: "推奨構図: 上空からの光 + 視線誘導",
      };
  }
}

function getModalIllustrationSlot(
  activeIntervention: InterventionKind | null,
): {
  kind: "watch" | "bless" | "test";
  src: string;
  title: string;
  note: string;
} {
  const kind =
    activeIntervention === "bless" || activeIntervention === "test" ? activeIntervention : "watch";

  if (kind === "bless") {
    return {
      kind,
      src: RYO_ILLUSTRATIONS.bless,
      title: "Bless illustration slot",
      note: "加護の介入挿絵をここへ差し込みます。asset 未到着時は placeholder を維持します。",
    };
  }

  if (kind === "test") {
    return {
      kind,
      src: RYO_ILLUSTRATIONS.test,
      title: "Test illustration slot",
      note: "試練の介入挿絵をここへ差し込みます。asset 未到着時は placeholder を維持します。",
    };
  }

  return {
    kind,
    src: RYO_ILLUSTRATIONS.watch,
    title: "Watch illustration slot",
    note: "観察の基準挿絵をここへ差し込みます。asset 未到着時は placeholder を維持します。",
  };
}

function getModalPortraitSrc(params: {
  event: WorldEvent;
  targetCharacter?: Character;
  activeIntervention: "bless" | "test" | null;
  judgementPreview: JudgementResult | null;
  revealed: boolean;
}) {
  const { event, targetCharacter, activeIntervention, judgementPreview, revealed } = params;

  if (!revealed) {
    if (activeIntervention === "test" || event.trigger === "warning") {
      return RYO_PORTRAITS.tense;
    }

    return RYO_PORTRAITS.normal;
  }

  if (judgementPreview?.rank === "critical") {
    return RYO_PORTRAITS.divine;
  }

  if (
    judgementPreview?.action === "bless" &&
    (judgementPreview.rank === "success" || judgementPreview.rank === "greatSuccess")
  ) {
    return RYO_PORTRAITS.joy;
  }

  if (
    judgementPreview?.rank === "failure" ||
    judgementPreview?.rank === "fumble" ||
    (event.trigger === "warning" && (targetCharacter?.lifespanRemaining ?? 99) <= 1 && !activeIntervention)
  ) {
    return RYO_PORTRAITS.sadness;
  }

  return RYO_PORTRAITS.normal;
}

function formatModifier(modifier: number) {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

export function EventModal({ event, tick, momentum, targetCharacter, onResolve }: EventModalProps) {
  const [rollingState, setRollingState] = useState<RollingState | null>(null);
  const [rollingValue, setRollingValue] = useState(1);
  const [illustrationLoadFailed, setIllustrationLoadFailed] = useState(false);
  const confirmLockRef = useRef(false);
  const presetPreviewIntervention =
    event?.presetIntervention === "bless" || event?.presetIntervention === "test"
      ? event.presetIntervention
      : null;
  const activeRollingIntervention = rollingState?.intervention ?? presetPreviewIntervention;
  const illustrationSlot = getModalIllustrationSlot(activeRollingIntervention);

  useEffect(() => {
    setRollingState(null);
    setRollingValue(1);
    setIllustrationLoadFailed(false);
    confirmLockRef.current = false;
  }, [event?.id]);

  useEffect(() => {
    if (!event || !targetCharacter) {
      return;
    }

    if (event.presetIntervention !== "bless" && event.presetIntervention !== "test") {
      return;
    }

    const finalRoll = Math.floor(Math.random() * 20) + 1;
    setRollingValue(Math.floor(Math.random() * 20) + 1);
    setRollingState(
      buildRollingState(
        targetCharacter,
        event,
        tick,
        momentum,
        event.presetIntervention,
        finalRoll,
      ),
    );
  }, [event?.id, event?.presetIntervention, momentum, targetCharacter, tick]);

  useEffect(() => {
    if (!rollingState || rollingState.revealed) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setRollingValue(Math.floor(Math.random() * 20) + 1);
    }, 80);

    const timeoutId = window.setTimeout(() => {
      setRollingValue(rollingState.judgement.roll);
      setRollingState((current) => (current ? { ...current, revealed: true } : current));
    }, 920);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [rollingState]);

  useEffect(() => {
    if (!rollingState?.revealed) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.repeat) {
        return;
      }

      event.preventDefault();
      handleConfirm();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [rollingState]);

  useEffect(() => {
    setIllustrationLoadFailed(false);
  }, [illustrationSlot.src]);

  if (!event) {
    return null;
  }

  const eventArtGuide = getEventArtGuide(event, targetCharacter);
  const isRolling =
    !!presetPreviewIntervention || rollingState?.intervention === "bless" || rollingState?.intervention === "test";
  const judgementPreview = rollingState?.judgement ?? null;
  const portraitSrc = getModalPortraitSrc({
    event,
    targetCharacter,
    activeIntervention: activeRollingIntervention,
    judgementPreview,
    revealed: rollingState?.revealed ?? false,
  });
  const blessPreviewModifier = targetCharacter ? getInterventionModifier(targetCharacter, "bless", momentum) : 0;
  const testPreviewModifier = targetCharacter ? getInterventionModifier(targetCharacter, "test", momentum) : 0;
  const recommendedIntervention: InterventionKind = event.trigger === "warning" ? "bless" : "watch";
  const recommendedReason =
    recommendedIntervention === "bless"
      ? "命運警告が出ているので、最初は Bless で助けに行くと意図がいちばん分かりやすいです。"
      : "まずは Watch で状況を見守ると、流れをつかみながら次の Test の準備も進められます。";
  const decisionGuideOptions: DecisionGuideOption[] = [
    {
      intervention: "watch",
      summary: "見守って記録を増やす",
      detail: `notable を 1 件増やし、状況の記録を残します。いまは ${targetCharacter?.notable.length ?? 0} 件です。`,
      context: "迷ったときや、まず流れを見たいときに向いています。",
    },
    {
      intervention: "bless",
      summary: "助けて良い結果を狙う",
      detail: `加護や残寿命を守る方向の介入です。今回の裁定補正は ${formatModifier(blessPreviewModifier)} です。`,
      context: "危なそうな場面で、まず助けたいときに向いています。",
    },
    {
      intervention: "test",
      summary: "試練を与えて成長を狙う",
      detail: `試練や Momentum の伸びを狙います。今回の裁定補正は ${formatModifier(testPreviewModifier)} です。`,
      context: "多少の危険より、成長や次の展開を重視したいときに向いています。",
    },
  ];

  const handleResolve = (intervention: InterventionKind) => {
    if (intervention === "watch") {
      onResolve(intervention);
      return;
    }

    if (!targetCharacter) {
      onResolve(intervention);
      return;
    }

    const finalRoll = Math.floor(Math.random() * 20) + 1;
    setRollingValue(Math.floor(Math.random() * 20) + 1);
    setRollingState(buildRollingState(targetCharacter, event, tick, momentum, intervention, finalRoll));
  };

  const handleConfirm = () => {
    if (!rollingState || confirmLockRef.current) {
      return;
    }

    confirmLockRef.current = true;
    const intervention = rollingState.intervention;
    const judgement = rollingState.judgement;
    setRollingState(null);
    onResolve(intervention, judgement);
  };

  const rollPanelClassName = [
    "roll-panel",
    activeRollingIntervention === "test" ? "roll-panel--test" : "",
    rollingState?.revealed ? `roll-panel--${rollingState.judgement.rank}` : "roll-panel--rolling",
  ]
    .filter(Boolean)
    .join(" ");

  const dieClassName = [
    "roll-panel__die",
    activeRollingIntervention === "test" ? "roll-panel__die--test" : "",
    rollingState?.revealed ? `roll-panel__die--${rollingState.judgement.rank}` : "roll-panel__die--rolling",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card event-modal" role="dialog" aria-modal="true" aria-labelledby="event-title">
        <div className="modal-card__media">
          <div className="art-slot art-slot--portrait art-slot--with-image">
            <img
              className="art-slot__image"
              src={portraitSrc}
              alt="Ryo portrait expression"
            />
            <div className="art-slot__meta">
              <span className="art-slot__eyebrow">portrait slot / ryo asset preview</span>
              <strong>基準キャラ: Ryo（portrait 接続済み）</strong>
              <span>{eventArtGuide.portraitLine}</span>
            </div>
          </div>
          <div
            className={[
              "art-slot",
              "art-slot--illustration",
              illustrationLoadFailed ? "" : "art-slot--with-image art-slot--illustration-image",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {illustrationLoadFailed ? (
              <>
                <span className="art-slot__eyebrow">{illustrationSlot.title} / placeholder</span>
                <strong>{triggerLabels[event.trigger]} の挿絵仮枠</strong>
                <span>{illustrationSlot.note}</span>
                <span>{eventArtGuide.illustrationLine}</span>
                <span>{eventArtGuide.shotLine}</span>
              </>
            ) : (
              <>
                <img
                  className="art-slot__image art-slot__image--illustration"
                  src={illustrationSlot.src}
                  alt={`${illustrationSlot.kind} illustration preview`}
                  onError={() => setIllustrationLoadFailed(true)}
                />
                <div className="art-slot__meta">
                  <span className="art-slot__eyebrow">{illustrationSlot.title}</span>
                  <strong>{triggerLabels[event.trigger]} の挿絵接続</strong>
                  <span>{illustrationSlot.note}</span>
                  <span>{eventArtGuide.shotLine}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="modal-card__body event-modal__body">
          <p className="eyebrow">important moment / {triggerLabels[event.trigger]}</p>
          <h2 id="event-title">{event.title}</h2>
          <p>{event.description}</p>

          {targetCharacter ? (
            <div className="event-target">
              <span>{targetCharacter.bloodlineName}</span>
              <span>
                {targetCharacter.role} / {targetCharacter.element} / {targetCharacter.yinYang}
              </span>
              <span>
                age {targetCharacter.age} / 残寿命 {targetCharacter.lifespanRemaining}
              </span>
              <span>観察メモ {targetCharacter.notable.length} 件</span>
              <span>notable 2 件以上で次の Test に +1 / 現在の Momentum {momentum} でさらに最大 +2</span>
            </div>
          ) : null}
          <div className="subpanel event-cause">
            <p className="event-cause__eyebrow">これは介入イベントです</p>
            <strong>なぜ今、ここで止まったのか</strong>
            <p className="event-cause__lead">
              世界の進行をいったん止めて、あなたが次の介入を選ぶ場面です。下の 3 つから、いま何をしたいかを選べます。
            </p>
            <span>{event.triggerSummary}</span>
            <span>{event.causeSummary}</span>
          </div>

          {isRolling ? (
            <div className={rollPanelClassName}>
              <p className="eyebrow">shikigami judgement</p>
              <strong>
                {activeRollingIntervention === "bless"
                  ? rollingState?.revealed
                    ? "Bless の裁定結果"
                    : "Bless を裁定中"
                  : rollingState?.revealed
                    ? "Test の裁定結果"
                    : "Test を裁定中"}
              </strong>
              <div className={dieClassName}>{rollingValue}</div>
              {rollingState?.revealed && judgementPreview ? (
                <>
                  <div className="subpanel judgement-card">
                    <div className="summary-card__header">
                      <h3>裁定結果</h3>
                      <span className={`judgement-rank judgement-rank--${judgementPreview.rank}`}>
                        {getJudgementRankLabel(judgementPreview.rank)}
                      </span>
                    </div>
                    <div className="judgement-grid">
                      <span>行為 {judgementPreview.action === "bless" ? "Bless" : "Test"}</span>
                      <span>対象 {judgementPreview.targetCharacterName}</span>
                      <span>式 {judgementPreview.formula}</span>
                      <span>出目 {judgementPreview.roll}</span>
                      <span>
                        補正 {judgementPreview.modifier >= 0 ? `+${judgementPreview.modifier}` : judgementPreview.modifier}
                      </span>
                      <span>合計 {judgementPreview.total}</span>
                    </div>
                    <p>{judgementPreview.effect}</p>
                    <p className="summary-note">副作用: {judgementPreview.sideEffect ?? "なし"}</p>
                    <div className="judgement-changes">
                      {judgementPreview.changes.map((change) => (
                        <span key={change.label}>
                          {change.label} {change.before} → {change.after}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="event-actions">
                    <button className="button" onClick={handleConfirm}>
                      確認
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p>出目 {judgementPreview?.roll ?? rollingValue} が定まるまで、式神が裁定を整えています。</p>
                  <p>止まったあと、内容を読んでから適用できます。</p>
                </>
              )}
            </div>
          ) : (
            <>
              <section className="event-decision-guide" aria-labelledby="event-decision-guide-title">
                <div className="event-decision-guide__header">
                  <p className="eyebrow event-decision-guide__eyebrow">decision guide</p>
                  <h3 id="event-decision-guide-title" className="event-decision-guide__title">
                    Watch / Bless / Test の違い
                  </h3>
                  <p className="event-decision-guide__intro">
                    迷ったら 1 つずつ役割を読むだけで大丈夫です。最初は「何を増やしたいか」で選ぶと判断しやすくなります。
                  </p>
                </div>
                <div className="event-decision-guide__cards">
                  {decisionGuideOptions.map((option) => (
                    <article
                      key={option.intervention}
                      className={[
                        "event-decision-guide__card",
                        option.intervention === recommendedIntervention ? "event-decision-guide__card--recommended" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {option.intervention === recommendedIntervention ? (
                        <span className="event-decision-guide__pill">初回おすすめ</span>
                      ) : null}
                      <h4>{labels[option.intervention]}</h4>
                      <p className="event-decision-guide__summary">{option.summary}</p>
                      <p className="event-decision-guide__detail">{option.detail}</p>
                      <p className="event-decision-guide__context">{option.context}</p>
                    </article>
                  ))}
                </div>
                <div className="event-decision-guide__recommendation">
                  <strong>
                    初回おすすめ: {labels[recommendedIntervention]}
                  </strong>
                  <p>{recommendedReason}</p>
                </div>
              </section>
              <div className="event-actions event-actions--decision">
                {interventions.map((intervention) => (
                  <button
                    key={intervention}
                    className={[
                      "button",
                      "event-actions__button",
                      intervention === recommendedIntervention ? "event-actions__button--recommended" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => handleResolve(intervention)}
                  >
                    {intervention === recommendedIntervention ? (
                      <span className="event-actions__badge">初回おすすめ</span>
                    ) : null}
                    <span className="event-actions__label">{labels[intervention]}</span>
                    <span className="event-actions__hint">
                      {decisionGuideOptions.find((option) => option.intervention === intervention)?.summary}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
