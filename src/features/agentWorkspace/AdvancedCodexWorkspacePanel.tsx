import { useMemo, useRef, useState } from "react";
import type { Character } from "../../domain/types";

interface AdvancedCodexWorkspacePanelProps {
  focusedCharacter?: Character;
}

type CopyStatus = "idle" | "copied" | "selected" | "failed";

function sanitizeSegment(value: string, fallback: string): string {
  const normalized = value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || fallback;
}

function buildFolderStructure(workspaceName: string, characterId: string): string {
  return `${workspaceName}/
  AGENTS.md
  world.md
  save/
    current-session.json
  characters/
    ${characterId}.md
  events/
  apostle-notes/
  imports/
  exports/`;
}

function buildWorldSample(characterName: string, memo: string): string {
  const memoLine = memo.trim()
    ? `\n## 今回のメモ\n${memo.trim()}\n`
    : "";

  return `# World Context

このフォルダは GodSandbox の外部補助ワークスペースです。

## プレイヤー
プレイヤーは新米神様です。

## 世界
小さな箱庭世界です。
キャラクターは自分なりに暮らし、出来事に出会い、変化していきます。

## 注目キャラクター
${characterName}

## 基本ループ
1. 箱庭を見る
2. キャラクターに気づく
3. 見守る / 助ける / 試練を与える
4. キャラクターが変化する
5. 必要なら外部へ Character Passport や soul file として持ち出す
${memoLine}
## 安全メモ
secret、API key、token、個人PCの絶対パスはここに書かないでください。`;
}

function buildCharacterSample(characterId: string, characterName: string, memo: string): string {
  const memoText = memo.trim() || "まだ未設定です。";

  return `# ${characterName}

## characterId
${characterId}

## name
${characterName}

## role
箱庭の住民

## personality
まだ未設定です。

## visual
画像ファイルを使う場合は、相対パスで記録します。

## notes
${memoText}`;
}

function buildSessionExplanation(characterId: string): string {
  return `save/current-session.json は、現在の観察状態を外部Codexに渡すための任意ファイルです。
実装済みのセーブデータではなく、ユーザーが必要に応じて作るメモとして扱います。

例:
{
  "schemaVersion": "workspace-save-example-v1",
  "source": "GodSandbox",
  "note": "This is an example. Do not put secrets or personal paths here.",
  "activeCharacterId": "${characterId}",
  "lastKnownTick": 0,
  "events": []
}`;
}

function buildImportsExportsGuide(): string {
  return `imports/:
外部サービスや別アプリでの対話メモを置く場所です。
GodSandbox本体のコードやsecretは置きません。

exports/:
外部サービスへ渡す下書きを置く場所です。
例: character-soul.md、world-context.md

このフォルダは、ユーザーが自分のPCで管理する作業場です。
アプリ内からCodex / Claudeを起動したり、外部APIへ送信したりしません。`;
}

function buildCodexPrompt(characterId: string, characterName: string, memo: string): string {
  const memoText = memo.trim()
    ? `\nユーザーの短いメモ:\n${memo.trim()}\n`
    : "";

  return `あなたは GodSandbox の外部補助エージェントです。

プレイヤーは新米神様です。
あなたはゲーム内の使徒ではなく、ユーザーのローカル作業フォルダを整理する補助役です。

対象キャラクター:
- characterId: ${characterId}
- name: ${characterName}${memoText}
目的:
- world.md を読んで箱庭世界観を理解する
- characters/ のキャラクター情報を読む
- save/current-session.json があれば現在状態を読む
- imports/ に外部対話後のメモがあれば取り込む
- exports/ に外部サービスへ渡す character-soul.md や world-context.md の下書きを作る
- ゲーム本体のコードを勝手に変更しない
- secret、API key、token、個人PCの絶対パスを保存しない
- ユーザーの許可なしにGit commitしない

作業の進め方:
1. まず AGENTS.md と world.md を読む
2. characters/${characterId}.md を読む
3. save/current-session.json があれば読む
4. 必要なら imports/ のメモを確認する
5. exports/ に下書きを作る前に、何を作るかユーザーへ短く確認する

注意:
このワークスペースは GodSandbox 本体repoではありません。
本体コード、package、CI、secret、個人用設定を変更しないでください。`;
}

export function AdvancedCodexWorkspacePanel({ focusedCharacter }: AdvancedCodexWorkspacePanelProps) {
  const [workspaceName, setWorkspaceName] = useState("godsandbox-agent-workspace");
  const [characterId, setCharacterId] = useState(focusedCharacter?.id ?? "example-character");
  const [characterName, setCharacterName] = useState(focusedCharacter?.name ?? "Example");
  const [memo, setMemo] = useState("");
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const fullGuideRef = useRef<HTMLTextAreaElement>(null);

  const safeWorkspaceName = sanitizeSegment(workspaceName, "godsandbox-agent-workspace");
  const safeCharacterId = sanitizeSegment(characterId, focusedCharacter?.id ?? "example-character");
  const displayCharacterName = characterName.trim() || focusedCharacter?.name || "Example";

  const generated = useMemo(() => {
    const folderStructure = buildFolderStructure(safeWorkspaceName, safeCharacterId);
    const codexPrompt = buildCodexPrompt(safeCharacterId, displayCharacterName, memo);
    const worldSample = buildWorldSample(displayCharacterName, memo);
    const characterSample = buildCharacterSample(safeCharacterId, displayCharacterName, memo);
    const sessionExplanation = buildSessionExplanation(safeCharacterId);
    const importsExportsGuide = buildImportsExportsGuide();
    const fullGuide = [
      "# GodSandbox Codex連携セットアップ",
      "この内容を外部Codexへ貼り付け、ユーザー自身の作業フォルダを準備します。",
      "GodSandboxアプリはCodex / Claudeを直接起動しません。",
      "## 推奨フォルダ構成",
      folderStructure,
      "## Codexへ貼る固定プロンプト",
      codexPrompt,
      "## world.md サンプル",
      worldSample,
      `## characters/${safeCharacterId}.md サンプル`,
      characterSample,
      "## save/current-session.json の説明",
      sessionExplanation,
      "## imports/ と exports/ の使い方",
      importsExportsGuide,
    ].join("\n\n");

    return {
      characterSample,
      codexPrompt,
      folderStructure,
      fullGuide,
      importsExportsGuide,
      sessionExplanation,
      worldSample,
    };
  }, [displayCharacterName, memo, safeCharacterId, safeWorkspaceName]);

  function applyFocusedCharacter() {
    if (!focusedCharacter) {
      return;
    }

    setCharacterId(focusedCharacter.id);
    setCharacterName(focusedCharacter.name);
    setCopyStatus("idle");
  }

  async function copyFullGuide() {
    setCopyStatus("idle");

    try {
      await navigator.clipboard.writeText(generated.fullGuide);
      setCopyStatus("copied");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = generated.fullGuide;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      textarea.style.opacity = "0";
      textarea.style.pointerEvents = "none";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      try {
        const copied = document.execCommand("copy");

        if (copied) {
          setCopyStatus("copied");
        } else if (fullGuideRef.current) {
          fullGuideRef.current.focus();
          fullGuideRef.current.select();
          setCopyStatus("selected");
        } else {
          setCopyStatus("failed");
        }
      } catch {
        if (fullGuideRef.current) {
          fullGuideRef.current.focus();
          fullGuideRef.current.select();
          setCopyStatus("selected");
        } else {
          setCopyStatus("failed");
        }
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }

  return (
    <section className="panel advanced-codex-panel" aria-labelledby="advanced-codex-title">
      <details>
        <summary className="advanced-codex-panel__summary">
          <span>
            <span className="eyebrow">advanced / optional</span>
            <strong id="advanced-codex-title">上級者向け: Codex連携</strong>
          </span>
          <span className="advanced-codex-panel__summary-note">外部Codexへ貼る手順を作る</span>
        </summary>

        <div className="advanced-codex-panel__body">
          <p className="advanced-codex-panel__lead">
            GodSandboxの外でCodexを起動し、この箱庭専用フォルダを読ませると、
            キャラクターや世界設定をもとにロールプレイ補助ができます。
            この画面は手順と固定プロンプトを作るだけで、アプリ内からCodexは起動しません。
          </p>

          <div className="advanced-codex-panel__notice">
            個人PCの絶対パス、secret、API key、tokenは保存しません。
            入力内容はこの画面内で生成に使うだけです。
          </div>

          <div className="advanced-codex-panel__form" aria-label="Codex連携プロンプト入力">
            <label className="advanced-codex-field">
              <span>workspaceName</span>
              <input
                value={workspaceName}
                onChange={(event) => {
                  setWorkspaceName(event.target.value);
                  setCopyStatus("idle");
                }}
                placeholder="godsandbox-agent-workspace"
              />
            </label>

            <label className="advanced-codex-field">
              <span>characterId</span>
              <input
                value={characterId}
                onChange={(event) => {
                  setCharacterId(event.target.value);
                  setCopyStatus("idle");
                }}
                placeholder="example-character"
              />
            </label>

            <label className="advanced-codex-field">
              <span>characterName</span>
              <input
                value={characterName}
                onChange={(event) => {
                  setCharacterName(event.target.value);
                  setCopyStatus("idle");
                }}
                placeholder="Example"
              />
            </label>

            <label className="advanced-codex-field advanced-codex-field--wide">
              <span>任意の短いメモ</span>
              <textarea
                value={memo}
                onChange={(event) => {
                  setMemo(event.target.value);
                  setCopyStatus("idle");
                }}
                placeholder="例: 初めてBlessを受けた。慎重だが好奇心が強い。"
                rows={3}
              />
            </label>
          </div>

          <div className="advanced-codex-panel__actions">
            <button className="button button--ghost" disabled={!focusedCharacter} onClick={applyFocusedCharacter}>
              注目キャラを反映
            </button>
            <button className="button" onClick={copyFullGuide}>
              生成内容をコピー
            </button>
            <span className="advanced-codex-panel__copy-status" role="status">
              {copyStatus === "copied"
                ? "コピーしました"
                : copyStatus === "selected"
                  ? "ブラウザの制限で直接コピーできないため、下の全文を選択しました。Ctrl+C / ⌘Cでコピーしてください。"
                : copyStatus === "failed"
                  ? "コピーできませんでした。下の内容を手動で選択してください。"
                  : " "}
            </span>
          </div>

          <div className="advanced-codex-panel__outputs">
            <section className="advanced-codex-output advanced-codex-output--full">
              <h3>まとめてコピー用テキスト</h3>
              <textarea ref={fullGuideRef} readOnly value={generated.fullGuide} />
            </section>

            <section className="advanced-codex-output">
              <h3>推奨フォルダ構成</h3>
              <pre>{generated.folderStructure}</pre>
            </section>

            <section className="advanced-codex-output">
              <h3>Codexへ貼る固定プロンプト</h3>
              <pre>{generated.codexPrompt}</pre>
            </section>

            <section className="advanced-codex-output">
              <h3>world.md サンプル</h3>
              <pre>{generated.worldSample}</pre>
            </section>

            <section className="advanced-codex-output">
              <h3>characters/{safeCharacterId}.md サンプル</h3>
              <pre>{generated.characterSample}</pre>
            </section>

            <section className="advanced-codex-output">
              <h3>save/current-session.json の説明</h3>
              <pre>{generated.sessionExplanation}</pre>
            </section>

            <section className="advanced-codex-output">
              <h3>imports/ と exports/ の使い方</h3>
              <pre>{generated.importsExportsGuide}</pre>
            </section>
          </div>
        </div>
      </details>
    </section>
  );
}
