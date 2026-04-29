import type {
  LlmProvider,
  UtteranceEventKind,
  UtteranceRequest,
  UtteranceResponse,
} from "../../application/utterance/types";

const JAPANESE_TEMPLATES: Record<UtteranceEventKind, string> = {
  watch: "{name}は、見届けられたことに気づいて息を整えた。",
  bless: "{name}は、かすかな加護の気配に目を細めた。",
  test: "{name}は、試練の気配を前にして拳を握った。",
  warning: "{name}は、迫る終わりの気配に言葉を失った。",
  routine: "{name}は、流れる日々の中で小さくうなずいた。",
  manual: "{name}は、神の気配を感じて顔を上げた。",
  unknown: "{name}は、世界の揺らぎを静かに受け止めた。",
};

const ENGLISH_TEMPLATES: Record<UtteranceEventKind, string> = {
  watch: "{name} notices that someone has been watching over them.",
  bless: "{name} narrows their eyes at a faint blessing.",
  test: "{name} clenches a fist before the coming trial.",
  warning: "{name} falls silent before the approaching end.",
  routine: "{name} nods quietly amid ordinary days.",
  manual: "{name} looks up as a divine presence draws near.",
  unknown: "{name} quietly receives the world's distortion.",
};

function renderTemplate(template: string, name: string) {
  return template.replaceAll("{name}", name);
}

function clampText(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, Math.max(0, maxLength - 1)) + "…";
}

export function createTemplateProvider(): LlmProvider {
  return {
    kind: "template",
    async generate(request: UtteranceRequest): Promise<UtteranceResponse> {
      const templates =
        request.constraints.language === "ja" ? JAPANESE_TEMPLATES : ENGLISH_TEMPLATES;
      const template = templates[request.situation.eventKind] ?? templates.unknown;
      const text = renderTemplate(template, request.character.name);

      return {
        status: "ok",
        providerKind: "template",
        text: clampText(text, request.constraints.maxLength),
      };
    },
  };
}
