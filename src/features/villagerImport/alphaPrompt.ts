export type VillagerAlphaPromptInput = {
  characterName: string;
};

export type VillagerAlphaPromptResult = {
  characterName: string;
  assetName: string;
  fileName: string;
  savePath: string;
  policyNotice: string;
  prompt: string;
};

const DEFAULT_ASSET_NAME = "villager-character";

export const VILLAGER_ALPHA_POLICY_NOTICE =
  "画像を使う前に、著作権、転載可否、AI利用ポリシー、本人または権利者の許可を確認してください。secret、個人情報、許可のない画像は使わないでください。";

export function normalizeVillagerAssetName(characterName: string): string {
  const normalized = characterName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\.+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || DEFAULT_ASSET_NAME;
}

export function buildVillagerAlphaPrompt(
  input: VillagerAlphaPromptInput,
): VillagerAlphaPromptResult {
  const assetName = normalizeVillagerAssetName(input.characterName);
  const fileName = `${assetName}.png`;
  const savePath = `image/villager/${fileName}`;

  const prompt = [
    "You are preparing a game-ready transparent character asset for GodSandbox.",
    "Use the attached image only as the identity reference.",
    "Preserve the character's face, hair, outfit, colors, silhouette, and overall mood.",
    "Remove the background completely.",
    "Output a PNG with a real alpha channel.",
    "The transparent area must be alpha 0.",
    "Do not bake in a white background, green background, checkerboard background, shadow box, or scene background.",
    "Do not leave a white matte, outline halo, or solid edge around the character.",
    "Do not output JPEG.",
    "Do not crop off the character.",
    "Do not redesign the character.",
    "Do not add text labels.",
    `Save the result as: ${savePath}`,
    "",
    "Before generating, confirm that the user has the right to use this image and that using it with AI generation is allowed.",
  ].join("\n");

  return {
    characterName: input.characterName.trim(),
    assetName,
    fileName,
    savePath,
    policyNotice: VILLAGER_ALPHA_POLICY_NOTICE,
    prompt,
  };
}
