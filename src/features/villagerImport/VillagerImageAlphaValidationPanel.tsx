import { useMemo, useState, type ChangeEvent } from "react";
import {
  formatCornerAlphaSummary,
  formatRatioAsPercent,
  sortValidationMessages,
  summarizeEdgeBackgroundTone,
  validateVillagerImageAlpha,
  type VillagerImageAlphaValidationResult,
} from "./imageAlphaValidation";
import "./VillagerImageAlphaValidationPanel.css";

interface VillagerImageAlphaValidationPanelProps {
  initialResult?: VillagerImageAlphaValidationResult | null;
  initialErrorMessage?: string | null;
}

function getFormatLabel(format: VillagerImageAlphaValidationResult["format"]) {
  switch (format) {
    case "png":
      return "PNG";
    case "jpeg":
      return "JPEG";
    default:
      return "その他";
  }
}

function getSeverityLabel(severity: "error" | "warning" | "info") {
  switch (severity) {
    case "error":
      return "NG";
    case "warning":
      return "要確認";
    default:
      return "参考";
  }
}

export function VillagerImageAlphaValidationPanel({
  initialResult = null,
  initialErrorMessage = null,
}: VillagerImageAlphaValidationPanelProps) {
  const [result, setResult] = useState<VillagerImageAlphaValidationResult | null>(initialResult);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage);
  const [isInspecting, setIsInspecting] = useState(false);
  const sortedMessages = useMemo(
    () => (result ? sortValidationMessages(result.messages) : []),
    [result],
  );

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    setResult(null);
    setErrorMessage(null);

    if (!file) {
      return;
    }

    setIsInspecting(true);

    try {
      const nextResult = await validateVillagerImageAlpha(file);
      setResult(nextResult);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "画像検査に失敗しました。");
    } finally {
      setIsInspecting(false);
      event.target.value = "";
    }
  }

  return (
    <section className="villager-alpha-validation panel">
      <div className="villager-alpha-validation__header">
        <div>
          <p className="eyebrow">villager import guard</p>
          <h2>alpha 付き画像かを先に検査する</h2>
        </div>
        <label className="villager-alpha-validation__picker">
          <input
            accept="image/png,image/jpeg"
            className="villager-alpha-validation__input"
            onChange={handleFileChange}
            type="file"
          />
          画像を選ぶ
        </label>
      </div>

      <p className="villager-alpha-validation__intro">
        箱庭に入れる前に、背景が透過されているかをざっくり検査します。PNG でも外周が全部不透明なら警告します。
      </p>

      {isInspecting ? <p className="villager-alpha-validation__busy">画像を検査しています…</p> : null}
      {errorMessage ? <p className="villager-alpha-validation__error">{errorMessage}</p> : null}

      {result ? (
        <div className="villager-alpha-validation__result">
          <div className="villager-alpha-validation__facts">
            <div className="villager-alpha-validation__fact">
              <span className="villager-alpha-validation__fact-label">形式</span>
              <strong>{getFormatLabel(result.format)}</strong>
            </div>
            <div className="villager-alpha-validation__fact">
              <span className="villager-alpha-validation__fact-label">サイズ</span>
              <strong>
                {result.width} x {result.height}
              </strong>
            </div>
            <div className="villager-alpha-validation__fact">
              <span className="villager-alpha-validation__fact-label">外周透過</span>
              <strong>{formatRatioAsPercent(result.transparentEdgeRatio)}</strong>
            </div>
            <div className="villager-alpha-validation__fact">
              <span className="villager-alpha-validation__fact-label">四隅 alpha</span>
              <strong>{formatCornerAlphaSummary(result.cornerAlphaValues)}</strong>
            </div>
            <div className="villager-alpha-validation__fact">
              <span className="villager-alpha-validation__fact-label">背景の気配</span>
              <strong>{summarizeEdgeBackgroundTone(result)}</strong>
            </div>
          </div>

          <ul className="villager-alpha-validation__messages">
            {sortedMessages.map((message) => (
              <li
                className={`villager-alpha-validation__message villager-alpha-validation__message--${message.severity}`}
                key={message.code}
              >
                <span className="villager-alpha-validation__message-badge">{getSeverityLabel(message.severity)}</span>
                <span>{message.text}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="villager-alpha-validation__placeholder">
          <p>PNG は alpha を持てますが、白背景が焼き込まれていると箱庭で浮いて見えます。</p>
          <p>JPEG はこの時点で NG と出します。Codex へは「alpha付きPNG」「背景を焼き込まない」と指定してください。</p>
        </div>
      )}
    </section>
  );
}
