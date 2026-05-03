export type VillagerImageFormat = "png" | "jpeg" | "other";
export type VillagerImageValidationSeverity = "error" | "warning" | "info";

export interface VillagerImageValidationMessage {
  code: string;
  severity: VillagerImageValidationSeverity;
  text: string;
}

export interface VillagerImageAlphaValidationResult {
  fileName: string;
  mimeType: string;
  format: VillagerImageFormat;
  width: number;
  height: number;
  sampledEdgePixels: number;
  transparentEdgePixels: number;
  transparentAnyPixels: number;
  cornerAlphaValues: number[];
  opaqueEdgeRatio: number;
  transparentEdgeRatio: number;
  transparentAnyRatio: number;
  lightOpaqueEdgeRatio: number;
  checkerLikeEdgeRatio: number;
  hasAnyTransparency: boolean;
  messages: VillagerImageValidationMessage[];
}

type EdgePixelSample = {
  alpha: number;
  red: number;
  green: number;
  blue: number;
};

const EDGE_SAMPLE_DEPTH = 3;
const LIGHT_EDGE_THRESHOLD = 238;
const CHECKER_LIGHT_MIN = 164;
const CHECKER_LIGHT_MAX = 236;
const CHECKER_CHROMA_DELTA = 16;

function getFormatFromFile(file: File): VillagerImageFormat {
  const mimeType = file.type.toLowerCase();
  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return "jpeg";
  }

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".png")) {
    return "png";
  }

  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
    return "jpeg";
  }

  return "other";
}

function isLightOpaquePixel(sample: EdgePixelSample) {
  return (
    sample.alpha >= 250 &&
    sample.red >= LIGHT_EDGE_THRESHOLD &&
    sample.green >= LIGHT_EDGE_THRESHOLD &&
    sample.blue >= LIGHT_EDGE_THRESHOLD
  );
}

function isCheckerLikeOpaquePixel(sample: EdgePixelSample) {
  const brightness = (sample.red + sample.green + sample.blue) / 3;
  const maxDelta = Math.max(
    Math.abs(sample.red - sample.green),
    Math.abs(sample.green - sample.blue),
    Math.abs(sample.red - sample.blue),
  );

  return (
    sample.alpha >= 250 &&
    brightness >= CHECKER_LIGHT_MIN &&
    brightness <= CHECKER_LIGHT_MAX &&
    maxDelta <= CHECKER_CHROMA_DELTA
  );
}

function getBrightness(sample: EdgePixelSample) {
  return (sample.red + sample.green + sample.blue) / 3;
}

function buildEdgeSampleIndexes(width: number, height: number, depth: number) {
  const indexes = new Set<number>();
  const maxX = Math.max(0, width - 1);
  const maxY = Math.max(0, height - 1);
  const lastInset = Math.max(0, Math.min(depth - 1, Math.floor(Math.min(width, height) / 2)));

  for (let inset = 0; inset <= lastInset; inset += 1) {
    const top = inset;
    const bottom = maxY - inset;
    const left = inset;
    const right = maxX - inset;

    for (let x = left; x <= right; x += 1) {
      indexes.add((top * width + x) * 4);
      indexes.add((bottom * width + x) * 4);
    }

    for (let y = top; y <= bottom; y += 1) {
      indexes.add((y * width + left) * 4);
      indexes.add((y * width + right) * 4);
    }
  }

  return Array.from(indexes);
}

function readCornerAlphas(data: Uint8ClampedArray, width: number, height: number) {
  const corners = [
    [0, 0],
    [Math.max(0, width - 1), 0],
    [0, Math.max(0, height - 1)],
    [Math.max(0, width - 1), Math.max(0, height - 1)],
  ] as const;

  return corners.map(([x, y]) => data[(y * width + x) * 4 + 3] ?? 255);
}

function collectEdgeSamples(data: Uint8ClampedArray, width: number, height: number) {
  return buildEdgeSampleIndexes(width, height, EDGE_SAMPLE_DEPTH).map((pixelIndex) => ({
    red: data[pixelIndex] ?? 0,
    green: data[pixelIndex + 1] ?? 0,
    blue: data[pixelIndex + 2] ?? 0,
    alpha: data[pixelIndex + 3] ?? 255,
  }));
}

function countTransparentPixels(data: Uint8ClampedArray) {
  let transparentPixels = 0;

  for (let index = 3; index < data.length; index += 4) {
    if ((data[index] ?? 255) < 250) {
      transparentPixels += 1;
    }
  }

  return transparentPixels;
}

function analyzeAlphaImageData(
  file: File,
  format: VillagerImageFormat,
  width: number,
  height: number,
  data: Uint8ClampedArray,
): VillagerImageAlphaValidationResult {
  const totalPixelCount = Math.max(1, width * height);
  const edgeSamples = collectEdgeSamples(data, width, height);
  const sampledEdgePixels = Math.max(1, edgeSamples.length);
  const transparentEdgePixels = edgeSamples.filter((sample) => sample.alpha < 250).length;
  const transparentAnyPixels = countTransparentPixels(data);
  const cornerAlphaValues = readCornerAlphas(data, width, height);
  const lightOpaqueEdgePixels = edgeSamples.filter(isLightOpaquePixel).length;
  const checkerLikeEdgePixels = edgeSamples.filter(isCheckerLikeOpaquePixel).length;
  const messages: VillagerImageValidationMessage[] = [];

  if (format === "jpeg") {
    messages.push({
      code: "jpeg-not-supported",
      severity: "error",
      text: "JPEG は透明背景を持てないため、このままでは箱庭取り込みに向きません。alpha 付き PNG を使ってください。",
    });
  } else if (format === "other") {
    messages.push({
      code: "unsupported-format",
      severity: "error",
      text: "この画像形式は今回の検査対象外です。alpha 付き PNG を選んでください。",
    });
  }

  const opaqueEdgeRatio = (sampledEdgePixels - transparentEdgePixels) / sampledEdgePixels;
  const transparentEdgeRatio = transparentEdgePixels / sampledEdgePixels;
  const transparentAnyRatio = transparentAnyPixels / totalPixelCount;
  const lightOpaqueEdgeRatio = lightOpaqueEdgePixels / sampledEdgePixels;
  const checkerLikeEdgeRatio = checkerLikeEdgePixels / sampledEdgePixels;
  const hasAnyTransparency = transparentAnyPixels > 0;

  if (format === "png") {
    if (!hasAnyTransparency) {
      messages.push({
        code: "missing-alpha",
        severity: "warning",
        text: "この画像は透明背景ではない可能性があります。alpha 付き PNG か確認してください。",
      });
    }

    if (opaqueEdgeRatio >= 0.95 && cornerAlphaValues.every((alpha) => alpha >= 250)) {
      messages.push({
        code: "opaque-outer-edge",
        severity: "warning",
        text: "外周に透明領域が見つかりません。白い背景が画像として焼き込まれている可能性があります。",
      });
    }

    if (lightOpaqueEdgeRatio >= 0.35) {
      messages.push({
        code: "light-background-baked",
        severity: "warning",
        text: "白い背景が画像として焼き込まれている可能性があります。Codex で「alpha付きPNG」「背景を焼き込まない」と指定して再生成してください。",
      });
    }

    if (checkerLikeEdgeRatio >= 0.28) {
      messages.push({
        code: "checker-pattern-baked",
        severity: "warning",
        text: "チェッカー柄が画像として焼き込まれている可能性があります。透過プレビューではなく、alpha 付き PNG を書き出してください。",
      });
    }

    if (messages.length === 0) {
      messages.push({
        code: "alpha-looks-usable",
        severity: "info",
        text: "外周の透明領域はありそうです。このまま箱庭向け候補として扱えます。",
      });
    }
  }

  return {
    fileName: file.name,
    mimeType: file.type,
    format,
    width,
    height,
    sampledEdgePixels,
    transparentEdgePixels,
    transparentAnyPixels,
    cornerAlphaValues,
    opaqueEdgeRatio,
    transparentEdgeRatio,
    transparentAnyRatio,
    lightOpaqueEdgeRatio,
    checkerLikeEdgeRatio,
    hasAnyTransparency,
    messages,
  };
}

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("画像を読み込めませんでした。"));
    };

    image.src = objectUrl;
  });
}

export async function validateVillagerImageAlpha(file: File): Promise<VillagerImageAlphaValidationResult> {
  const format = getFormatFromFile(file);
  const image = await loadImageFromFile(file);
  const width = Math.max(1, image.naturalWidth || image.width || 1);
  const height = Math.max(1, image.naturalHeight || image.height || 1);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("画像検査用の Canvas を初期化できませんでした。");
  }

  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);

  return analyzeAlphaImageData(file, format, width, height, imageData.data);
}

export function formatRatioAsPercent(ratio: number) {
  return `${Math.round(ratio * 100)}%`;
}

export function formatCornerAlphaSummary(cornerAlphaValues: number[]) {
  if (cornerAlphaValues.length === 0) {
    return "-";
  }

  const minAlpha = Math.min(...cornerAlphaValues);
  const maxAlpha = Math.max(...cornerAlphaValues);
  return `${minAlpha} - ${maxAlpha}`;
}

export function summarizeEdgeBackgroundTone(result: VillagerImageAlphaValidationResult) {
  if (result.lightOpaqueEdgeRatio >= 0.35) {
    return "白背景が残っている可能性";
  }

  if (result.checkerLikeEdgeRatio >= 0.28) {
    return "チェッカー柄が残っている可能性";
  }

  if (!result.hasAnyTransparency) {
    return "透明領域が見つからない";
  }

  return "透過候補あり";
}

export function sortValidationMessages(messages: VillagerImageValidationMessage[]) {
  const priority: Record<VillagerImageValidationSeverity, number> = {
    error: 0,
    warning: 1,
    info: 2,
  };

  return [...messages].sort((left, right) => priority[left.severity] - priority[right.severity]);
}

export function describeOpaqueEdgeBlendRisk(edgeSamples: EdgePixelSample[]) {
  if (edgeSamples.length === 0) {
    return 0;
  }

  const brightEdgeCount = edgeSamples.filter((sample) => getBrightness(sample) >= 240 && sample.alpha >= 250).length;
  return brightEdgeCount / edgeSamples.length;
}
