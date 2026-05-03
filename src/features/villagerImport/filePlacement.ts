const VILLAGER_IMAGE_DIRECTORY = "image/villager";
const FALLBACK_VILLAGER_NAME = "villager";

interface DirectoryPickerHandleLike {
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<DirectoryPickerHandleLike>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileHandleLike>;
}

interface FileHandleLike {
  createWritable(): Promise<WritableStreamLike>;
}

interface WritableStreamLike {
  write(data: Blob | BufferSource | string): Promise<void>;
  close(): Promise<void>;
}

interface DirectoryPickerWindowLike {
  showDirectoryPicker?: (options?: { mode?: "read" | "readwrite"; startIn?: string }) => Promise<DirectoryPickerHandleLike>;
}

export interface VillagerFilePlacementResult {
  fileName: string;
  logicalPath: string;
}

export function toVillagerBaseName(characterName: string) {
  const normalized = characterName.normalize("NFKC").trim();
  const replacedWhitespace = normalized.replace(/\s+/g, "_");
  const safe = replacedWhitespace
    .replace(/[^\p{Letter}\p{Number}_-]+/gu, "_")
    .replace(/_+/g, "_")
    .replace(/^[_-]+|[_-]+$/g, "");

  if (!safe) {
    return FALLBACK_VILLAGER_NAME;
  }

  return safe.slice(0, 80);
}

export function toVillagerPngFileName(characterName: string) {
  return `${toVillagerBaseName(characterName)}.png`;
}

export function getVillagerLogicalPath(characterName: string) {
  return `${VILLAGER_IMAGE_DIRECTORY}/${toVillagerPngFileName(characterName)}`;
}

export function supportsVillagerFilePlacement(windowLike?: DirectoryPickerWindowLike) {
  const runtimeWindow =
    windowLike ?? (typeof window !== "undefined" ? (window as DirectoryPickerWindowLike) : undefined);

  return typeof runtimeWindow?.showDirectoryPicker === "function";
}

export async function saveVillagerPngToChosenRoot(params: {
  characterName: string;
  pngBlob: Blob;
  windowLike?: DirectoryPickerWindowLike;
}): Promise<VillagerFilePlacementResult> {
  const { characterName, pngBlob, windowLike } = params;
  const runtimeWindow =
    windowLike ?? (typeof window !== "undefined" ? (window as DirectoryPickerWindowLike) : undefined);

  if (!runtimeWindow?.showDirectoryPicker) {
    throw new Error("File System Access API is not available in this browser.");
  }

  const rootDirectory = await runtimeWindow.showDirectoryPicker({
    mode: "readwrite",
    startIn: "pictures",
  });
  const imageDirectory = await rootDirectory.getDirectoryHandle("image", { create: true });
  const villagerDirectory = await imageDirectory.getDirectoryHandle("villager", { create: true });
  const fileName = toVillagerPngFileName(characterName);
  const fileHandle = await villagerDirectory.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();

  await writable.write(pngBlob);
  await writable.close();

  return {
    fileName,
    logicalPath: getVillagerLogicalPath(characterName),
  };
}
