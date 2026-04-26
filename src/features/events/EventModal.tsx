import { useEffect, useRef, useState } from "react";
import { getInterventionModifier, getJudgementRankLabel, previewJudgement } from "../../domain/world";
import type { Character, InterventionKind, JudgementResult, WorldEvent } from "../../domain/types";

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

const RYO_PORTRAITS = {
  normal: "/art/portraits/ryo/ryo_normal.jpeg",
  tense: "/art/portraits/ryo/ryo_tense.jpeg",
  sadness: "/art/portraits/ryo/ryo_sadness.jpeg",
  joy: "/art/portraits/ryo/ryo_joy.jpeg",
  divine: "/art/portraits/ryo/ryo_divine.jpeg",
} as const;

const RYO_ILLUSTRATIONS = {
  watch: "/art/illustrations/ryo/ryo_watch.jpeg",
  bless: "/art/illustrations/ryo/ryo_bless.jpeg",
  test: "/art/illustrations/ryo/ryo_test.jpeg",
} as const;

interface RollingState {
  intervention: "bless" | "test";
  judgement: JudgementResult;
  revealed: boolean;
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

export function EventModal({ event, tick, momentum, targetCharacter, onResolve }: EventModalProps) {
  const [rollingState, setRollingState] = useState<RollingState | null>(null);
  const [rollingValue, setRollingValue] = useState(1);
  const [illustrationLoadFailed, setIllustrationLoadFailed] = useState(false);
  const confirmLockRef = useRef(false);

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

  if (!event) {
    return null;
  }

  const presetPreviewIntervention =
    event.presetIntervention === "bless" || event.presetIntervention === "test"
      ? event.presetIntervention
      : null;
  const eventArtGuide = getEventArtGuide(event, targetCharacter);
  const activeRollingIntervention = rollingState?.intervention ?? presetPreviewIntervention;
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
  const illustrationSlot = getModalIllustrationSlot(activeRollingIntervention);
  const testPreviewModifier = targetCharacter ? getInterventionModifier(targetCharacter, "test", momentum) : 0;

  useEffect(() => {
    setIllustrationLoadFailed(false);
  }, [illustrationSlot.src]);

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
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="event-title">
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
          <div className="art-slot art-slot--illustration">
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

        <div className="modal-card__body">
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
            <strong>なぜ今、介入が必要か</strong>
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
              <p className="summary-note">
                Watch は兆しを見届けて notable を増やします。notable が 2 件以上ある個体は、次の Test に +1 補正が入ります。
              </p>
              <p className="summary-note">
                この場の Test は notable 補正込みで {testPreviewModifier >= 0 ? `+${testPreviewModifier}` : testPreviewModifier} から始まります。
              </p>
              <div className="event-actions">
                {interventions.map((intervention) => (
                  <button key={intervention} className="button" onClick={() => handleResolve(intervention)}>
                    {labels[intervention]}
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
