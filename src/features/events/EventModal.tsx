import type { Character, InterventionKind, WorldEvent } from "../../domain/types";

interface EventModalProps {
  event: WorldEvent | null;
  targetCharacter?: Character;
  onResolve: (intervention: InterventionKind) => void;
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

export function EventModal({ event, targetCharacter, onResolve }: EventModalProps) {
  if (!event) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="event-title">
        <div className="modal-card__media">
          <div className="event-portrait">
            <span>{targetCharacter?.name ?? event.targetCharacterName}</span>
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
            </div>
          ) : null}
          <div className="event-actions">
            {interventions.map((intervention) => (
              <button key={intervention} className="button" onClick={() => onResolve(intervention)}>
                {labels[intervention]}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
