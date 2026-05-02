import type { JudgementRank, JudgementResult } from "../../domain/types";
import "./TutorialRewardExplainer.css";

interface TutorialRewardExplainerProps {
  blessingJudgement: JudgementResult;
}

function getBlessTutorialLead(rank: JudgementRank, targetCharacterName: string) {
  if (rank === "success" || rank === "greatSuccess" || rank === "critical") {
    return `使徒はいま、${targetCharacterName} への Bless で命運が少し良い方向へ動いたと告げています。`;
  }

  return `使徒はいま、${targetCharacterName} への Bless は命運を良い方向へ導こうとする介入だったと告げています。`;
}

export function TutorialRewardExplainer({ blessingJudgement }: TutorialRewardExplainerProps) {
  return (
    <section className="subpanel tutorial-reward-explainer" aria-labelledby="tutorial-reward-explainer-title">
      <div className="summary-card__header">
        <h3 id="tutorial-reward-explainer-title">使徒の補足</h3>
        <span className="placeholder-chip">チュートリアル</span>
      </div>

      <p className="tutorial-reward-explainer__lead">
        {getBlessTutorialLead(blessingJudgement.rank, blessingJudgement.targetCharacterName)}
      </p>

      <div className="tutorial-reward-explainer__grid">
        <article className="tutorial-reward-explainer__card">
          <div className="tutorial-reward-explainer__row">
            <strong>神様ポイント</strong>
            <span className="placeholder-chip">準備中</span>
          </div>
          <p>
            今後、神様ポイントは介入回復や新しい個体発見に使う力として扱う予定です。
          </p>
        </article>

        <article className="tutorial-reward-explainer__card">
          <div className="tutorial-reward-explainer__row">
            <strong>チュートリアル報酬</strong>
            <span className="placeholder-chip">後続実装予定</span>
          </div>
          <p>
            まだ実際のポイント加算や消費は行っていません。ここでは、次に何へつながる力かだけを先に案内しています。
          </p>
        </article>
      </div>

      <p className="summary-note tutorial-reward-explainer__note">
        使徒は「次はこの力で新しい気配を探せるようになります」と告げています。
      </p>
    </section>
  );
}
