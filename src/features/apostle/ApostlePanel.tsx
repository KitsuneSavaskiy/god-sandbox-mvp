import { useEffect, useState } from "react";
import { RYO_PORTRAITS } from "../../assets/artPaths";
import { getJudgementRankLabel } from "../../domain/world";
import type { BloodlineSummary, Character, EventSummary, InterventionKind, JudgementResult } from "../../domain/types";
import { TutorialRewardExplainer } from "../tutorial/TutorialRewardExplainer";

interface ApostlePanelProps {
  apostleMessage: string;
  focusedCharacter?: Character;
  characters: Character[];
  bloodlines: BloodlineSummary[];
  latestEventSummary: EventSummary | null;
  latestJudgement: JudgementResult | null;
  momentum: number;
  protectionRemaining: number;
  hasLivingCharacters: boolean;
  paused: boolean;
  onSelectCharacter: (characterId: string) => void;
  onTriggerManualEvent: () => void;
  onRequestCharacterAction: (intervention: InterventionKind, characterName: string) => void;
}

const CHARACTER_ACTIONS: Array<{
  intervention: InterventionKind;
  label: string;
  description: string;
  tone: "watch" | "bless" | "test";
}> = [
  {
    intervention: "watch",
    label: "Watch 見守る",
    description: "まず様子を見て、変化を記録します。",
    tone: "watch",
  },
  {
    intervention: "bless",
    label: "Bless 助ける",
    description: "良い変化を起こしたい時の主導線です。",
    tone: "bless",
  },
  {
    intervention: "test",
    label: "Test 試す",
    description: "試練を与えて、成長のきっかけを作ります。",
    tone: "test",
  },
];

function getPanelPortraitSrc(paused: boolean, latestJudgement: JudgementResult | null) {
  if (paused) {
    return RYO_PORTRAITS.tense;
  }

  if (latestJudgement?.rank === "critical") {
    return RYO_PORTRAITS.divine;
  }

  if (latestJudgement?.rank === "failure" || latestJudgement?.rank === "fumble") {
    return RYO_PORTRAITS.sadness;
  }

  if (
    latestJudgement?.action === "bless" &&
    (latestJudgement.rank === "success" || latestJudgement.rank === "greatSuccess")
  ) {
    return RYO_PORTRAITS.joy;
  }

  return RYO_PORTRAITS.normal;
}

function getPortraitGuide(name?: string) {
  return {
    subjectLabel: "アート基準キャラ: Ryo（portrait 接続済み）",
    toneLabel: name ? `現在の表示対象: ${name}` : "現在の表示対象: なし",
    expressionLine: "推奨差分: 平静 / 気づき / 緊張 / 覚悟",
    note: "この枠は、artPaths.ts の Ryo 表情差分を参照する generic な portrait 受け皿です。",
  };
}

export function ApostlePanel({
  apostleMessage,
  focusedCharacter,
  characters,
  bloodlines,
  latestEventSummary,
  latestJudgement,
  momentum,
  protectionRemaining,
  hasLivingCharacters,
  paused,
  onSelectCharacter,
  onTriggerManualEvent,
  onRequestCharacterAction,
}: ApostlePanelProps) {
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [portraitLoadFailed, setPortraitLoadFailed] = useState(false);
  const [tutorialBlessJudgement, setTutorialBlessJudgement] = useState<JudgementResult | null>(null);

  useEffect(() => {
    setNotesExpanded(false);
  }, [focusedCharacter?.id]);

  useEffect(() => {
    if (latestJudgement?.action !== "bless") {
      return;
    }

    setTutorialBlessJudgement(latestJudgement);
  }, [latestJudgement]);

  const portraitGuide = getPortraitGuide(focusedCharacter?.name);
  const latestNotable = focusedCharacter
    ? focusedCharacter.notable[focusedCharacter.notable.length - 1] ?? null
    : null;
  const recentNotables = focusedCharacter ? [...focusedCharacter.notable].slice(-3).reverse() : [];
  const portraitSrc = getPanelPortraitSrc(paused, latestJudgement);
  const livingCharacters = characters.filter((character) => character.alive);

  useEffect(() => {
    setPortraitLoadFailed(false);
  }, [portraitSrc]);

  return (
    <section className="panel">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">apostle</p>
          <h2>使徒の語り</h2>
        </div>
        <button className="button button--ghost" disabled={paused || !hasLivingCharacters} onClick={onTriggerManualEvent}>
          選択キャラに関わる
        </button>
      </div>

      <p className="narration">{apostleMessage}</p>

      <div className="subpanel focus-action-panel" aria-label="代表キャラ選択と行動">
        <div className="focus-action-panel__header">
          <div>
            <p className="eyebrow">first focus</p>
            <h3>代表キャラを選ぶ</h3>
          </div>
          <span className="focus-action-panel__badge">
            {focusedCharacter ? `選択中: ${focusedCharacter.name}` : "未選択"}
          </span>
        </div>
        <p className="focus-action-panel__lead">
          まず1人を選ぶと、箱庭がその住民を追い、神様が次にできることを選べます。
        </p>
        <div className="focus-character-picker" aria-label="生存中の代表キャラ">
          {livingCharacters.map((character) => (
            <button
              key={character.id}
              type="button"
              className={[
                "focus-character-picker__button",
                focusedCharacter?.id === character.id ? "focus-character-picker__button--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={paused}
              onClick={() => onSelectCharacter(character.id)}
            >
              <span>{character.name}</span>
              <small>
                {character.bloodlineName} / 残寿命 {character.lifespanRemaining}
              </small>
            </button>
          ))}
          {livingCharacters.length === 0 ? <span className="summary-note">選べる住民はいません。</span> : null}
        </div>
        <div className="focus-action-panel__current">
          <strong>{focusedCharacter ? `${focusedCharacter.name}に何をしますか？` : "代表キャラを選んでください"}</strong>
          <span>
            {focusedCharacter
              ? "Watch / Bless / Test のどれかを選ぶと、その住民への関わり方が始まります。"
              : "住民を1タップすると、次の行動ボタンが使いやすくなります。"}
          </span>
        </div>
        <div className="focus-action-panel__actions">
          {CHARACTER_ACTIONS.map((action) => (
            <button
              key={action.intervention}
              type="button"
              className={`focus-action-button focus-action-button--${action.tone}`}
              disabled={paused || !focusedCharacter}
              onClick={() => {
                if (focusedCharacter) {
                  onRequestCharacterAction(action.intervention, focusedCharacter.name);
                }
              }}
            >
              <span>{action.label}</span>
              <small>{action.description}</small>
            </button>
          ))}
        </div>
        <p className="focus-action-panel__note">
          iPhoneではダブルクリックではなく、このボタンから進めます。PCでは従来の操作も補助として使えます。
        </p>
      </div>

      <div className="subpanel">
        <div className="summary-card__header">
          <h3>最新イベント要約</h3>
          {latestEventSummary ? (
            <span className={`summary-chip summary-chip--${latestEventSummary.layer}`}>
              {latestEventSummary.layer === "flow"
                ? "流し"
                : latestEventSummary.layer === "notable"
                  ? "注目"
                  : "介入"}
            </span>
          ) : null}
        </div>
        {latestEventSummary ? (
          <div className="summary-card">
            <strong>{latestEventSummary.title}</strong>
            <span>tick {latestEventSummary.tick}</span>
            <p>{latestEventSummary.description}</p>
          </div>
        ) : (
          <p>まだイベント要約はありません。</p>
        )}
        {protectionRemaining > 0 ? (
          <p className="summary-note">
            起動直後の保護時間中です。あと {protectionRemaining} tick は自動介入イベントが出ません。
          </p>
        ) : null}
      </div>

      {latestJudgement ? (
        <div className="subpanel judgement-card">
          <div className="summary-card__header">
            <h3>式神の裁定</h3>
            <span className={`judgement-rank judgement-rank--${latestJudgement.rank}`}>
              {getJudgementRankLabel(latestJudgement.rank)}
            </span>
          </div>
          <div className="judgement-grid">
            <span>行為 {latestJudgement.action === "bless" ? "Bless" : "Test"}</span>
            <span>対象 {latestJudgement.targetCharacterName}</span>
            <span>式 {latestJudgement.formula}</span>
            <span>出目 {latestJudgement.roll}</span>
            <span>補正 {latestJudgement.modifier >= 0 ? `+${latestJudgement.modifier}` : latestJudgement.modifier}</span>
            <span>合計 {latestJudgement.total}</span>
          </div>
          <p>{latestJudgement.effect}</p>
          <p className="summary-note">
            副作用: {latestJudgement.sideEffect ?? "なし"}
          </p>
          <div className="judgement-changes">
            {latestJudgement.changes.map((change) => (
              <span key={change.label}>
                {change.label} {change.before} → {change.after}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {tutorialBlessJudgement ? (
        <TutorialRewardExplainer blessingJudgement={tutorialBlessJudgement} />
      ) : null}

      {!hasLivingCharacters ? (
        <div className="subpanel">
          <strong>生存者はいません</strong>
          <p>この PBI では箱庭の観察をここで停止し、残されたログだけを確認できます。</p>
        </div>
      ) : null}

      <div className="subpanel art-receptacle">
        <div className="summary-card__header">
          <h3>アート受け皿</h3>
          <span className="placeholder-chip">接続済み</span>
        </div>
        <div className={["art-slot", "art-slot--portrait", portraitLoadFailed ? "" : "art-slot--with-image"].filter(Boolean).join(" ")}>
          {portraitLoadFailed ? (
            <>
              <span className="art-slot__eyebrow">portrait slot / fallback</span>
              <strong>{portraitGuide.subjectLabel}</strong>
              <span>{portraitGuide.toneLabel}</span>
              <span>画像を読み込めなかったため、説明表示に切り替えています。</span>
              <p className="summary-note">{portraitGuide.note}</p>
            </>
          ) : (
            <>
              <img
                className="art-slot__image"
                src={portraitSrc}
                alt="Ryo portrait base"
                onError={() => setPortraitLoadFailed(true)}
              />
              <div className="art-slot__meta">
                <span className="art-slot__eyebrow">portrait slot / ryo asset preview</span>
                <strong>{portraitGuide.subjectLabel}</strong>
                <span>{portraitGuide.toneLabel}</span>
                <span>{portraitGuide.expressionLine}</span>
                <p className="summary-note">{portraitGuide.note}</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="stack">
        <div className="subpanel">
          <h3>注目個体</h3>
          {focusedCharacter ? (
            <div className="character-card character-card--focused">
              <strong>{focusedCharacter.name}</strong>
              <span>{focusedCharacter.bloodlineName}</span>
              <span>
                {focusedCharacter.role} / {focusedCharacter.element} / {focusedCharacter.yinYang}
              </span>
              <span>
                age {focusedCharacter.age} / 残寿命 {focusedCharacter.lifespanRemaining}
              </span>
              <span>加護 {focusedCharacter.blessings} / 試練 {focusedCharacter.trials}</span>
              <span>Momentum {momentum} / 次の Test に最大 +2</span>
              <span>
                観察メモ {focusedCharacter.notable.length} 件 / notable 2 件以上で次の Test に +1
              </span>
              <span className="summary-note">試練が加護を上回ると、死亡時の記録はより苛烈なものになります。</span>
              {latestNotable ? <span>直近の変化: {latestNotable}</span> : null}
              {focusedCharacter.notable.length > 0 ? (
                <div className="notes-block">
                  <button
                    className="button button--ghost notes-toggle"
                    type="button"
                    onClick={() => setNotesExpanded((current) => !current)}
                  >
                    {notesExpanded ? "観察メモを閉じる" : "観察メモを開く"}
                  </button>
                  {notesExpanded ? (
                    <div className="notes-list">
                      {recentNotables.map((note, index) => (
                        <span key={`${focusedCharacter.id}-note-${index}`}>{note}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <p>注目中の個体はいません。</p>
          )}
        </div>

        <div className="subpanel">
          <h3>血統サマリ</h3>
          <div className="bloodline-grid">
            {bloodlines.map((bloodline) => (
              <article key={bloodline.id} className="bloodline-card">
                <strong>{bloodline.name}</strong>
                <span>生存 {bloodline.aliveCount}</span>
                <span>お気に入り {bloodline.favoriteCount}</span>
                <span>加護 {bloodline.totalBlessings}</span>
                <span>試練 {bloodline.totalTrials}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="subpanel">
          <h3>個体一覧</h3>
          <div className="character-list">
            {characters.map((character) => (
              <button
                key={character.id}
                className={`character-list__item ${
                  focusedCharacter?.id === character.id ? "character-list__item--active" : ""
                }`}
                disabled={!character.alive || paused}
                onClick={() => onSelectCharacter(character.id)}
              >
                <span>{character.name}</span>
                <span>{character.alive ? "生存" : "死亡"}</span>
                <span>{character.bloodlineName}</span>
                {!character.alive && character.deathReason ? <span>{character.deathReason}</span> : null}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
