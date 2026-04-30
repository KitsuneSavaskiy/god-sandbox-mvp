import { useRef, useState } from "react";
import {
  createMinimalCharacterPassport,
  formatMinimalCharacterPassport,
} from "../../application/passport/createMinimalCharacterPassport";
import type { Character } from "../../domain/types";

interface PassportExportPanelProps {
  focusedCharacter?: Character;
}

export function PassportExportPanel({ focusedCharacter }: PassportExportPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("まだコピーしていません。");
  const previewRef = useRef<HTMLTextAreaElement>(null);
  const passport = focusedCharacter ? createMinimalCharacterPassport(focusedCharacter) : null;
  const passportJson = passport ? formatMinimalCharacterPassport(passport) : "";

  async function copyPassportJsonToClipboard() {
    try {
      await navigator.clipboard.writeText(passportJson);
      return true;
    } catch {
      const textarea = previewRef.current ?? document.createElement("textarea");
      textarea.value = passportJson;
      textarea.setAttribute("readonly", "true");
      if (!previewRef.current) {
        textarea.style.position = "fixed";
        textarea.style.top = "-1000px";
        document.body.append(textarea);
      }
      textarea.focus();
      textarea.select();

      try {
        return document.execCommand("copy");
      } finally {
        if (!previewRef.current) {
          textarea.remove();
        }
      }
    }
  }

  async function handleCopy() {
    if (!passportJson) {
      return;
    }

    const copied = await copyPassportJsonToClipboard();
    setStatusMessage(
      copied
        ? "キャラ情報をクリップボードへコピーしました。"
        : "自動コピーできませんでした。JSONを選択したので、Ctrl+C でコピーできます。",
    );
  }

  function handleDownload() {
    if (!passport || !passportJson) {
      return;
    }

    const blob = new Blob([`${passportJson}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${passport.characterId}.passport.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMessage(".json ファイルとして保存する準備をしました。");
  }

  return (
    <section className="panel passport-export-panel">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">Character Passport</p>
          <h2>このキャラを持ち出す</h2>
        </div>
        <button
          className="button button--ghost"
          disabled={!passport}
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? "閉じる" : "Passportを表示"}
        </button>
      </div>

      <p className="summary-note">
        別ゲームで使うための、最小のキャラ紹介JSONです。GodSandboxの内部状態はそのまま出しません。
      </p>

      {!focusedCharacter ? (
        <p className="summary-note">注目キャラを選ぶと、持ち出し用JSONを確認できます。</p>
      ) : null}

      {passport && isOpen ? (
        <div className="passport-export">
          <div className="passport-export__actions">
            <button className="button" onClick={handleCopy}>
              キャラ情報をコピー
            </button>
            <button className="button button--ghost" onClick={handleDownload}>
              JSONファイルとして保存
            </button>
          </div>
          <p className="summary-note">{statusMessage}</p>
          <textarea
            ref={previewRef}
            className="passport-export__preview"
            readOnly
            aria-label="別ゲームで使うJSON"
            value={passportJson}
          />
        </div>
      ) : null}
    </section>
  );
}
