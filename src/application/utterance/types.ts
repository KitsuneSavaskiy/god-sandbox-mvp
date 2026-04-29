export type UtteranceProviderKind = "mock" | "template" | "serverProxy";

export type UtteranceLanguage = "ja" | "en";

export type UtteranceGenerationMode = "safe" | "dramatic" | "quiet";

export type UtteranceEventKind =
  | "watch"
  | "bless"
  | "test"
  | "warning"
  | "routine"
  | "manual"
  | "unknown";

export interface UtteranceCharacterContext {
  id: string;
  name: string;
  personalitySummary?: string;
  faithSummary?: string;
  growthSummary?: string;
  statusSummary?: string;
}

export interface UtteranceSituationContext {
  eventKind: UtteranceEventKind;
  eventSummary?: string;
  chaosSummary?: string;
  worldSummary?: string;
}

export interface UtteranceConstraints {
  maxLength: number;
  language: UtteranceLanguage;
  mode: UtteranceGenerationMode;
}

export interface UtteranceRequest {
  requestId: string;
  character: UtteranceCharacterContext;
  situation: UtteranceSituationContext;
  constraints: UtteranceConstraints;
}

export type UtteranceResponseStatus = "ok" | "unavailable" | "no-utterance";

export interface UtteranceResponse {
  status: UtteranceResponseStatus;
  providerKind: UtteranceProviderKind;
  text: string | null;
  reason?: string;
}

export interface LlmProvider {
  kind: UtteranceProviderKind;
  generate(request: UtteranceRequest): Promise<UtteranceResponse>;
}

export interface LlmProviderConfig {
  providerKind: UtteranceProviderKind;
  modelPreference?: string;
  maxOutputLength: number;
  language: UtteranceLanguage;
  generationMode: UtteranceGenerationMode;
}

export interface LlmProviderConfigRepository {
  readConfig(): Promise<LlmProviderConfig>;
  writeConfig(config: LlmProviderConfig): Promise<void>;
}
