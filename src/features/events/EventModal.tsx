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
  watch: "見守る",
  bless: "助ける",
  test: "試練",
};

const helpTexts: Record<InterventionKind, string> = {
  watch: "今は手を出さず、この子の様子を見ます。",
  bless: "小さな祝福で、この子に良い変化を起こします。",
  test: "成長のきっかけになる小さな困難を与えます。",
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
  helpText: string;
  helperNote: string;
}

interface BlessResultCallout {
  title: string;
  detail: string;
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
      title: "助ける挿絵枠",
      note: "加護の挿絵をここへ差し込みます。asset 未到着時は placeholder を維持します。",
    };
  }

  if (kind === "test") {
    return {
      kind,
      src: RYO_ILLUSTRATIONS.test,
      title: "試練の挿絵枠",
      note: "試練の挿絵をここへ差し込みます。asset 未到着時は placeholder を維持します。",
    };
  }

  return {
    kind,
    src: RYO_ILLUSTRATIONS.watch,
    title: "見守りの挿絵枠",
    note: "見守りの挿絵をここへ差し込みます。asset 未到着時は placeholder を維持します。",
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

function isTutorialBlessEvent(event: WorldEvent | null | undefined) {
  return event?.tutorialKind === "firstBless";
}

function getPauseReason(trigger: WorldEvent["trigger"], tutorialBlessEvent: boolean) {
  if (tutorialBlessEvent) {
    return "この命が弱り始めたので、最初にどう助けるかを選ぶために時間が止まっています。";
  }

  switch (trigger) {
    case "warning":
      return "危ない兆しが出たので、見守るか助けるかを決めるために時間が止まっています。";
    case "milestone":
      return "大きな節目に入ったので、この先をどう導くか決めるために時間が止まっています。";
    case "death":
      return "取り返しのつかない変化が起きたので、記録の前にあなたの判断を待っています。";
    case "manual":
      return "あなたが注目した出来事なので、ここで方針を選ぶために時間が止まっています。";
    default:
      return "大事な出来事が起きたので、次の行動を選ぶために時間が止まっています。";
  }
}

function getBlessResultCallout(judgement: JudgementResult | null): BlessResultCallout | null {
  if (!judgement || judgement.action !== "bless") {
    return null;
  }

  const improved = judgement.changes.filter(
    (change) =>
      (change.label === "残寿命" || change.label === "加護") &&
      change.after > change.before,
  );

  if (improved.length === 0) {
    return null;
  }

  const lifespanImproved = improved.some((change) => change.label === "残寿命");
  const blessingImproved = improved.some((change) => change.label === "加護");
  const detail = improved.map((change) => `${change.label} ${change.before} → ${change.after}`).join(" / ");

  return {
    title:
      lifespanImproved && blessingImproved
        ? "この助けで寿命も加護も良い方向へ伸びました"
        : lifespanImproved
          ? "この助けで寿命が良い方向へ伸びました"
          : "この助けで加護が良い方向へ伸びました",
    detail: `変化: ${detail}`,
  };
}

export function EventModal({ event, tick, momentum, targetCharacter, onResolve }: EventModalProps) {
  const [rollingState, setRollingState] = useState<RollingState | null>(null);
  const [rollingValue, setRollingValue] = useState(1);
  const [illustrationLoadFailed, setIllustrationLoadFailed] = useState(false);
  const [portraitLoadFailed, setPortraitLoadFailed] = useState(false);
  const [openHelpIntervention, setOpenHelpIntervention] = useState<InterventionKind | null>(null);
  const confirmLockRef = useRef(false);
  const tutorialBlessEvent = isTutorialBlessEvent(event);
  const presetPreviewIntervention =
    !tutorialBlessEvent && (event?.presetIntervention === "bless" || event?.presetIntervention === "test")
      ? event.presetIntervention
      : null;
  const activeRollingIntervention = rollingState?.intervention ?? presetPreviewIntervention;
  const illustrationSlot = getModalIllustrationSlot(activeRollingIntervention);
  const portraitSrc = event
    ? getModalPortraitSrc({
        event,
        targetCharacter,
        activeIntervention: activeRollingIntervention,
        judgementPreview: rollingState?.judgement ?? null,
        revealed: rollingState?.revealed ?? false,
      })
    : RYO_PORTRAITS.normal;

  useEffect(() => {
    setRollingState(null);
    setRollingValue(1);
    setIllustrationLoadFailed(false);
    setPortraitLoadFailed(false);
    setOpenHelpIntervention(null);
    confirmLockRef.current = false;
  }, [event?.id]);

  useEffect(() => {
    if (!event || !targetCharacter) {
      return;
    }

    if (tutorialBlessEvent || (event.presetIntervention !== "bless" && event.presetIntervention !== "test")) {
      return;
    }

    const finalRoll = tutorialBlessEvent && event.presetIntervention === "bless"
      ? 12
      : Math.floor(Math.random() * 20) + 1;
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
  }, [event?.id, event?.presetIntervention, momentum, targetCharacter, tick, tutorialBlessEvent]);

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

  useEffect(() => {
    setPortraitLoadFailed(false);
  }, [portraitSrc]);

  if (!event) {
    return null;
  }

  const eventArtGuide = getEventArtGuide(event, targetCharacter);
  const isRolling =
    !!presetPreviewIntervention || rollingState?.intervention === "bless" || rollingState?.intervention === "test";
  const judgementPreview = rollingState?.judgement ?? null;
  const blessPreviewModifier = targetCharacter ? getInterventionModifier(targetCharacter, "bless", momentum) : 0;
  const testPreviewModifier = targetCharacter ? getInterventionModifier(targetCharacter, "test", momentum) : 0;
  const pauseReason = getPauseReason(event.trigger, tutorialBlessEvent);
  const recommendedIntervention: InterventionKind =
    tutorialBlessEvent || event.trigger === "warning" ? "bless" : "watch";
  const recommendedBadgeLabel = tutorialBlessEvent ? "初回おすすめ" : "おすすめ";
  const recommendedReason =
    tutorialBlessEvent
      ? "まずは「助ける」で、この子に良い変化が起こる流れを見てみましょう。"
      : recommendedIntervention === "bless"
      ? "危ない兆しが出ているので、まずは「助ける」がいちばん分かりやすいです。"
      : "まだ急がなくてよさそうなので、まずは「見守る」で様子を見るのが分かりやすいです。";
  const blessResultCallout = getBlessResultCallout(judgementPreview);
  const decisionGuideOptions: DecisionGuideOption[] = [
    {
      intervention: "watch",
      helpText: helpTexts.watch,
      helperNote: "迷ったときや、まず流れを見たいときに向いています。",
    },
    {
      intervention: "bless",
      helpText: helpTexts.bless,
      helperNote: tutorialBlessEvent
        ? `今回はこれが主役です。成功すると残寿命や加護が良い方向へ伸びます。今の追い風は ${formatModifier(blessPreviewModifier)} です。`
        : `危なそうな場面で、まず助けたいときに向いています。今の追い風は ${formatModifier(blessPreviewModifier)} です。`,
    },
    {
      intervention: "test",
      helpText: helpTexts.test,
      helperNote: `多少の危険より、成長や次の展開を重視したいときに向いています。今の追い風は ${formatModifier(testPreviewModifier)} です。`,
    },
  ];

  const toggleHelp = (intervention: InterventionKind) => {
    setOpenHelpIntervention((current) => (current === intervention ? null : intervention));
  };

  const handleResolve = (intervention: InterventionKind) => {
    if (intervention === "watch") {
      onResolve(intervention);
      return;
    }

    if (!targetCharacter) {
      onResolve(intervention);
      return;
    }

    const finalRoll = tutorialBlessEvent && intervention === "bless" ? 12 : Math.floor(Math.random() * 20) + 1;
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
          <div className={["art-slot", "art-slot--portrait", portraitLoadFailed ? "" : "art-slot--with-image"].filter(Boolean).join(" ")}>
            {portraitLoadFailed ? (
              <>
                <span className="art-slot__eyebrow">portrait slot / fallback</span>
                <strong>基準キャラ: Ryo（portrait 接続済み）</strong>
                <span>{eventArtGuide.portraitLine}</span>
                <span>portrait 画像を読み込めなかったため、説明表示に切り替えています。</span>
              </>
            ) : (
              <>
                <img
                  className="art-slot__image"
                  src={portraitSrc}
                  alt="Ryo portrait expression"
                  onError={() => setPortraitLoadFailed(true)}
                />
                <div className="art-slot__meta">
                  <span className="art-slot__eyebrow">portrait slot / ryo asset preview</span>
                  <strong>基準キャラ: Ryo（portrait 接続済み）</strong>
                  <span>{eventArtGuide.portraitLine}</span>
                </div>
              </>
            )}
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
          <section className="event-pause-explainer" aria-label="時間停止の理由">
            <p className="event-pause-explainer__eyebrow">time paused</p>
            <strong className="event-pause-explainer__title">大事な出来事が起きたので、時間が止まっています</strong>
            <p className="event-pause-explainer__text">{pauseReason}</p>
            <p className="event-pause-explainer__text">
              {tutorialBlessEvent
                ? "これは正解当てではなく、助けたい方向を選ぶ場面です。今回は「助ける」で命を支える感覚をつかめば大丈夫です。"
                : "ここは正解探しではなく、育てたい方向を選ぶ場面です。選ぶと箱庭の時間が再開します。"}
            </p>
            <div className="event-pause-explainer__steps" aria-label="イベントの流れ">
              <span className="event-pause-explainer__step">1. 観察</span>
              <span className="event-pause-explainer__step event-pause-explainer__step--active">2. 重要イベント</span>
              <span className="event-pause-explainer__step event-pause-explainer__step--active">3. 判断</span>
              <span className="event-pause-explainer__step">4. 再開</span>
            </div>
          </section>

          {targetCharacter ? (
            <div className="event-target">
              <span>{targetCharacter.bloodlineName}</span>
              <span>
                {targetCharacter.role} / {targetCharacter.element} / {targetCharacter.yinYang}
              </span>
              <span>
                年齢 {targetCharacter.age} / 残寿命 {targetCharacter.lifespanRemaining}
              </span>
              <span>観察メモ {targetCharacter.notable.length} 件</span>
              <span>観察メモが増えるほど、あとで試練を選んだときに少し追い風がつきます。今の追い風 {momentum}</span>
            </div>
          ) : null}
          <div className="subpanel event-cause">
            <p className="event-cause__eyebrow">神様の判断が必要です</p>
            <strong>なぜ今、ここで止まったのか</strong>
            <p className="event-cause__lead">
              世界の進みをいったん止めて、あなたが次の行動を選ぶ場面です。下の 3 つから、いま育てたい方向に近いものを選べます。
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
                    ? "助けるの結果"
                    : "助けるの結果を見ています"
                  : rollingState?.revealed
                    ? "試練の結果"
                    : "試練の結果を見ています"}
              </strong>
              <div className={dieClassName}>{rollingValue}</div>
              {rollingState?.revealed && judgementPreview ? (
                <>
                  {blessResultCallout ? (
                    <div className="event-result-callout">
                      <strong>{blessResultCallout.title}</strong>
                      <p>{blessResultCallout.detail}</p>
                    </div>
                  ) : null}
                  <div className="subpanel judgement-card">
                    <div className="summary-card__header">
                      <h3>裁定結果</h3>
                      <span className={`judgement-rank judgement-rank--${judgementPreview.rank}`}>
                        {getJudgementRankLabel(judgementPreview.rank)}
                      </span>
                    </div>
                    <div className="judgement-grid">
                      <span>行為 {labels[judgementPreview.action]}</span>
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
                  <div className="event-actions event-actions--confirm">
                    <button className="button" type="button" onClick={handleConfirm}>
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
                    行動の選び方
                  </h3>
                  <p className="event-decision-guide__intro">
                    ボタンは短くしてあります。迷ったら「?」を押すと、それぞれの意味を読めます。
                  </p>
                </div>
                {tutorialBlessEvent ? (
                  <div className="event-decision-guide__tutorial-callout">
                    <p className="event-decision-guide__tutorial-eyebrow">apostle guide</p>
                    <strong>今回は「助ける」が主役です。</strong>
                    <p>まずはこの子に良い変化が起こる流れを、一度見てみましょう。</p>
                  </div>
                ) : null}
                <div className="event-decision-guide__mindset">
                  <strong>どれを選んでも不正解ではありません。</strong>
                  <p>いま起こしたい変化に一番近いものを選べば大丈夫です。</p>
                </div>
                <div className="event-decision-guide__recommendation">
                  <strong>
                    {recommendedBadgeLabel}: {labels[recommendedIntervention]}
                  </strong>
                  <p>{recommendedReason}</p>
                </div>
              </section>
              <div className="event-actions event-actions--decision">
                {interventions.map((intervention) => {
                  const option = decisionGuideOptions.find((entry) => entry.intervention === intervention);
                  const helpId = `${event.id}-${intervention}-help`;
                  const helpOpen = openHelpIntervention === intervention;
                  const isRecommended = intervention === recommendedIntervention;
                  return (
                    <article
                      key={intervention}
                      className={[
                        "event-action-row",
                        isRecommended ? "event-action-row--recommended" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <div className="event-action-row__controls">
                        <button
                          type="button"
                          className={[
                            "button",
                            "event-actions__button",
                            isRecommended ? "event-actions__button--recommended" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={() => handleResolve(intervention)}
                        >
                          <span className="event-actions__label">{labels[intervention]}</span>
                        </button>
                        <button
                          type="button"
                          className="button button--ghost event-actions__help-toggle"
                          aria-expanded={helpOpen}
                          aria-controls={helpId}
                          aria-label={`${labels[intervention]} の説明を開く`}
                          onClick={() => toggleHelp(intervention)}
                        >
                          ?
                        </button>
                      </div>
                      <div className="event-action-row__meta">
                        {isRecommended ? <span className="event-actions__badge">{recommendedBadgeLabel}</span> : null}
                      </div>
                      {helpOpen ? (
                        <div id={helpId} className="event-actions__help-panel">
                          <p>{option?.helpText}</p>
                          <p>{option?.helperNote}</p>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
