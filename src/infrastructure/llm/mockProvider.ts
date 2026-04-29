import type { LlmProvider, UtteranceRequest, UtteranceResponse } from "../../application/utterance/types";

function clampText(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, Math.max(0, maxLength - 1)) + "…";
}

export function createMockProvider(): LlmProvider {
  return {
    kind: "mock",
    async generate(request: UtteranceRequest): Promise<UtteranceResponse> {
      const text =
        request.constraints.language === "ja"
          ? `${request.character.name}は静かに状況を見つめている。`
          : `${request.character.name} quietly watches the situation.`;

      return {
        status: "ok",
        providerKind: "mock",
        text: clampText(text, request.constraints.maxLength),
      };
    },
  };
}
