import { useMemo, useState } from "react";
import {
  getVillagerLogicalPath,
  saveVillagerPngToChosenRoot,
  supportsVillagerFilePlacement,
  toVillagerPngFileName,
} from "./filePlacement";
import "./VillagerFilePlacementPanel.css";

interface VillagerFilePlacementPanelProps {
  characterName: string;
  pngBlob?: Blob | null;
}

export function VillagerFilePlacementPanel({
  characterName,
  pngBlob,
}: VillagerFilePlacementPanelProps) {
  const [statusMessage, setStatusMessage] = useState(
    "まだ保存していません。対応ブラウザならフォルダを選んで配置できます。",
  );
  const [isSaving, setIsSaving] = useState(false);
  const logicalPath = useMemo(() => getVillagerLogicalPath(characterName), [characterName]);
  const fileName = useMemo(() => toVillagerPngFileName(characterName), [characterName]);
  const canUseFileSystemAccess = useMemo(() => supportsVillagerFilePlacement(), []);

  async function handleSaveToChosenFolder() {
    if (!pngBlob) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await saveVillagerPngToChosenRoot({
        characterName,
        pngBlob,
      });
      setStatusMessage(`選んだフォルダ配下の ${result.logicalPath} に PNG を保存しました。`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatusMessage("保存先フォルダの選択をキャンセルしました。");
      } else {
        setStatusMessage("自動保存できませんでした。下の手順どおりに手動配置してください。");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="panel villager-file-placement">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">Villager image placement</p>
          <h2>villager 画像の置き場所</h2>
        </div>
      </div>

      <div className="villager-file-placement__path">
        <span className="summary-note">repo 内の論理保存先</span>
        <code>{logicalPath}</code>
      </div>

      <p className="villager-file-placement__status">
        {canUseFileSystemAccess
          ? "このブラウザでは、ユーザーが選んだフォルダにだけ保存できます。repo root を選ぶと image/villager/ 配下へ書き込みます。"
          : "このブラウザは File System Access API に対応していないため、自動保存は使えません。"}
      </p>

      {canUseFileSystemAccess ? (
        <div className="villager-file-placement__actions">
          <button
            className="button"
            type="button"
            disabled={!pngBlob || isSaving}
            onClick={handleSaveToChosenFolder}
          >
            {isSaving ? "保存中..." : "保存先フォルダを選んで配置"}
          </button>
        </div>
      ) : null}

      <p className="summary-note">{statusMessage}</p>

      <ol className="villager-file-placement__steps">
        <li>PNG を `{fileName}` の名前で用意します。</li>
        <li>repo の `image/villager/` に配置します。</li>
        <li>Git 管理へ含めるかどうかは、ユーザーがあとで手動判断します。</li>
      </ol>

      {!pngBlob ? (
        <p className="villager-file-placement__note">
          PNG を受け取ると、自動保存対応ブラウザではこのパネルから直接配置できます。
        </p>
      ) : null}

      <p className="villager-file-placement__note">
        個人PCの固定パスには保存しません。ユーザー操作なしにファイルを書き込まず、画像を自動で git add もしません。
      </p>
    </section>
  );
}
