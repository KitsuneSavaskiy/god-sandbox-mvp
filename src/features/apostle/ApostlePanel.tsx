import type { BloodlineSummary, Character, EventSummary } from "../../domain/types";

interface ApostlePanelProps {
  apostleMessage: string;
  focusedCharacter?: Character;
  characters: Character[];
  bloodlines: BloodlineSummary[];
  latestEventSummary: EventSummary | null;
  protectionRemaining: number;
  hasLivingCharacters: boolean;
  paused: boolean;
  onSelectCharacter: (characterId: string) => void;
  onTriggerManualEvent: () => void;
}

export function ApostlePanel({
  apostleMessage,
  focusedCharacter,
  characters,
  bloodlines,
  latestEventSummary,
  protectionRemaining,
  hasLivingCharacters,
  paused,
  onSelectCharacter,
  onTriggerManualEvent,
}: ApostlePanelProps) {
  const latestNotable = focusedCharacter
    ? focusedCharacter.notable[focusedCharacter.notable.length - 1] ?? null
    : null;

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

      {!hasLivingCharacters ? (
        <div className="subpanel">
          <strong>生存者はいません</strong>
          <p>この PBI では箱庭の観察をここで停止し、残されたログだけを確認できます。</p>
        </div>
      ) : null}

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
              {latestNotable ? <span>直近の変化: {latestNotable}</span> : null}
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
