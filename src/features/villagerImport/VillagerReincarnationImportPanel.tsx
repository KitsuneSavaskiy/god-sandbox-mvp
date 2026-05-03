import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { buildVillagerAlphaPrompt } from "./alphaPrompt";
import "./VillagerReincarnationImportPanel.css";

type CopyStatus = "idle" | "copied" | "selected" | "failed";

const IMPORT_NOTICE =
  "注: この機能はプレイヤーのデスクトップのCodexのAI画像生成機能を使います。通常のトークン枠内で利用可能ですが、著作物を扱う場合は制作者のAI利用や転載可否ポリシーを必ず確認してください。";

function stripFileExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

function buildReincarnationPrompt(characterName: string, alphaPrompt: string, sourceImageName?: string): string {
  const displayName = characterName.trim() || "新しい住民";
  const sourceLine = sourceImageName
    ? `- 元画像ファイル名: ${sourceImageName}`
    : "- 元画像ファイル名: ユーザーが選んだ立ち絵画像";

  return `あなたは GodSandbox のキャラクター画像生成を手伝う外部Codexです。

目的:
新米神様が選んだ1枚の立ち絵画像をもとに、箱庭へ転生する住民「${displayName}」の画像素材を作る準備をします。

前提:
- GodSandboxは、AIキャラクターが暮らす小さな箱庭を見守る育成サンドボックスです。
- プレイヤーは新米神様です。
- キャラクターは箱庭で暮らす住民です。
- この作業はGodSandboxアプリの外で行います。アプリ内からCodex pet/APIは呼びません。

入力:
${sourceLine}
- キャラクター名: ${displayName}

大切にすること:
- 元画像の同一人物感を維持してください。
- 髪型、目、服装、色味、年齢感を大きく変えないでください。
- 著作物を扱う場合は、制作者のAI利用や転載可否ポリシーを必ず確認してください。
- 個人情報、ロゴ、文字、不要な背景を混ぜないでください。

Codexへ貼る透明PNG生成指示:
${alphaPrompt}

注意:
- 保存先は上の生成指示に含まれる repo 内の論理パスです。固定の個人PCパスではありません。
- File System Access API が使えない場合は、必要に応じてユーザーが手動で配置してください。
- Codex pet/APIのアプリ内直接呼び出し、自動画像生成、sprite sheet生成、Passport schema変更は今回行いません。`;
}

interface VillagerReincarnationImportPanelProps {
  focusedCharacterName?: string;
}

export function VillagerReincarnationImportPanel({ focusedCharacterName }: VillagerReincarnationImportPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [characterName, setCharacterName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(nextPreviewUrl);

    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [selectedFile]);

  const alphaPromptResult = useMemo(() => buildVillagerAlphaPrompt({ characterName }), [characterName]);
  const targetPath = alphaPromptResult.savePath;
  const generatedPrompt = useMemo(
    () => buildReincarnationPrompt(characterName, alphaPromptResult.prompt, selectedFile?.name),
    [alphaPromptResult.prompt, characterName, selectedFile?.name],
  );

  function openFilePicker() {
    setHasConsented(true);
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setCopyStatus("idle");

    if (file) {
      setCharacterName((current) => current || stripFileExtension(file.name));
    }
  }

  async function copyPrompt() {
    setCopyStatus("idle");

    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopyStatus("copied");
    } catch {
      if (!promptRef.current) {
        setCopyStatus("failed");
        return;
      }

      promptRef.current.focus();
      promptRef.current.select();
      setCopyStatus("selected");
    }
  }

  function resetFlow() {
    setHasConsented(false);
    setSelectedFile(null);
    setCharacterName("");
    setCopyStatus("idle");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <section className="panel villager-import-panel" aria-labelledby="villager-import-title">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">reincarnation / optional</p>
          <h2 id="villager-import-title">新たな魂を転生させる</h2>
        </div>
        <button className="button button--ghost" onClick={() => setIsOpen((current) => !current)}>
          {isOpen ? "閉じる" : "新たな魂を転生させる"}
        </button>
      </div>

      <p className="villager-import-panel__lead">
        手元の立ち絵画像を選び、別ブラウザのCodexへ貼るための生成プロンプトと保存先を準備します。
        この画面からCodex pet/APIは直接呼びません。
      </p>

      {isOpen ? (
        <div className="villager-import-panel__body">
          <div className="villager-import-panel__notice" role="note">
            <strong>ファイルを箱庭にインポートしますか？</strong>
            <span>{IMPORT_NOTICE}</span>
          </div>

          <div className="villager-import-panel__actions">
            <button className="button" onClick={openFilePicker}>
              承諾して画像を選ぶ
            </button>
            <button className="button button--ghost" onClick={resetFlow}>
              入力をリセット
            </button>
          </div>

          <input
            ref={fileInputRef}
            className="villager-import-panel__file-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />

          <p className="villager-import-panel__hint">
            {hasConsented
              ? "標準のファイル選択UIで画像を選びます。個人PCの絶対パスは画面にもGit管理にも保存しません。"
              : "著作物の扱いを確認してから、画像選択へ進んでください。"}
          </p>

          {selectedFile ? (
            <div className="villager-import-panel__selected">
              <div className="villager-import-panel__preview">
                {previewUrl ? <img src={previewUrl} alt="選択した立ち絵プレビュー" /> : null}
              </div>

              <div className="villager-import-panel__form">
                <label className="villager-import-field">
                  <span>このキャラクターの名前</span>
                  <input
                    value={characterName}
                    onChange={(event) => {
                      setCharacterName(event.target.value);
                      setCopyStatus("idle");
                    }}
                    placeholder={focusedCharacterName ?? "Aki"}
                  />
                </label>

                <div className="villager-import-panel__target">
                  <span>保存先の目安</span>
                  <code>{targetPath}</code>
                  <p>
                    PR #236 の file placement helper と同じ論理保存先です。このパネルからは自動保存せず、
                    生成後のPNGをこの保存先に配置してください。
                  </p>
                </div>

                <div className="villager-import-panel__prompt-actions">
                  <button className="button" onClick={copyPrompt}>
                    Codex用プロンプトをコピー
                  </button>
                  <span role="status" className="villager-import-panel__copy-status">
                    {copyStatus === "copied"
                      ? "コピーしました"
                      : copyStatus === "selected"
                        ? "自動コピーできなかったため、プロンプト本文を選択しました。Ctrl+C / ⌘Cでコピーしてください。"
                        : copyStatus === "failed"
                          ? "コピーできませんでした。下の本文を手動で選択してください。"
                          : " "}
                  </span>
                </div>

                <textarea
                  ref={promptRef}
                  className="villager-import-panel__prompt"
                  readOnly
                  value={generatedPrompt}
                  aria-label="別ブラウザのCodexへ貼る転生準備プロンプト"
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
