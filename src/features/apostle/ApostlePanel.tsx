import { useEffect, useState } from "react";
import { getJudgementRankLabel } from "../../domain/world";
import type { BloodlineSummary, Character, EventSummary, JudgementResult } from "../../domain/types";

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
}

const RYO_PORTRAIT_NORMAL = "/art/portraits/ryo/ryo_normal.jpeg";

function getPortraitGuide(name?: string) {
  return {
    subjectLabel: "アート基準キャラ: Ryo（後続PBIで正式追加）",
    toneLabel: name ? `仮接続先: ${name}` : "仮接続先: なし",
    expressionLine: "推奨差分: 平静 / 気づき / 緊張 / 覚悟",
    note: "この枠は、後で Ryo の表情差分を差し込むための generic な仮受け皿です。",
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
}: ApostlePanelProps) {
  const [notesExpanded, setNotesExpanded] = useState(false);

  useEffect(() => {
    setNotesExpanded(false);
  }, [focusedCharacter?.id]);

  const portraitGuide = getPortraitGuide(focusedCharacter?.name);
  const latestNotable = focusedCharacter
    ? focusedCharacter.notable[focusedCharacter.notable.length - 1] ?? null
    : null;
  const recentNotables = focusedCharacter ? [...focusedCharacter.notable].slice(-3).reverse() : [];

  return (
    <section className="panel">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">apostle</p>
          <h2>使徒の語り</h2>
        </div>
        <button
          className="button button--ghost"
          disabled={paused || !hasLivingCharacters}
          onClick={onTriggerManualEvent}
        >
          開発: 手動イベント
        </button>
      </div>

      <p className="narration">{apostleMessage}</p>

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

      {!hasLivingCharacters ? (
        <div className="subpanel">
          <strong>生存者はいません</strong>
          <p>この PBI では箱庭の観察をここで停止し、残されたログだけを確認できます。</p>
        </div>
      ) : null}

      <div className="subpanel art-receptacle">
        <div className="summary-card__header">
          <h3>アート受け皿</h3>
          <span className="placeholder-chip">仮接続</span>
        </div>
        <div className="art-slot art-slot--portrait art-slot--with-image">
          <img
            className="art-slot__image"
            src={RYO_PORTRAIT_NORMAL}
            alt="Ryo portrait base"
          />
          <div className="art-slot__meta">
            <span className="art-slot__eyebrow">portrait slot / ryo asset preview</span>
            <strong>{portraitGuide.subjectLabel}</strong>
            <span>{portraitGuide.toneLabel}</span>
            <span>{portraitGuide.expressionLine}</span>
            <p className="summary-note">{portraitGuide.note}</p>
          </div>
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
