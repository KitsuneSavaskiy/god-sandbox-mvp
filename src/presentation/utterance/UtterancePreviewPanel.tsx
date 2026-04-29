import { useState } from "react";
import type { Character } from "../../domain/types";

export interface UtterancePreviewResult {
  providerLabel: string;
  status: "ok" | "unavailable" | "no-utterance";
  text: string | null;
  reason?: string;
}

interface UtterancePreviewPanelProps {
  focusedCharacter?: Character;
  disabled: boolean;
  onGenerate: () => Promise<UtterancePreviewResult[]>;
}

export function UtterancePreviewPanel({
  focusedCharacter,
  disabled,
  onGenerate,
}: UtterancePreviewPanelProps) {
  const [results, setResults] = useState<UtterancePreviewResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canGenerate = Boolean(focusedCharacter?.alive) && !disabled && !isGenerating;

  async function handleGenerate() {
    if (!canGenerate) {
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const nextResults = await onGenerate();
      setResults(nextResults);
    } catch {
      setErrorMessage("発話プレビューの生成に失敗しました。");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="subpanel">
      <div className="summary-card__header">
        <h3>発話プレビュー</h3>
        <span className="summary-chip summary-chip--notable">mock / template</span>
      </div>
      <p className="summary-note">
        実LLMを呼ばず、現在の注目個体から mock / template の発話だけを確認します。
      </p>
      <button
        className="button button--ghost"
        disabled={!canGenerate}
        type="button"
        onClick={handleGenerate}
      >
        {isGenerating ? "生成中" : "発話プレビューを生成"}
      </button>

      {!focusedCharacter ? <p>注目個体を選ぶと発話を確認できます。</p> : null}

      {errorMessage ? <p className="summary-note">{errorMessage}</p> : null}

      {results.length > 0 ? (
        <div className="stack">
          {results.map((result) => (
            <div key={result.providerLabel} className="summary-card">
              <strong>{result.providerLabel}</strong>
              {result.status === "ok" ? (
                <p>{result.text}</p>
              ) : (
                <p className="summary-note">{result.reason ?? "発話なし"}</p>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
