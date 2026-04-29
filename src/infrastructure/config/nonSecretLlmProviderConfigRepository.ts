import type {
  LlmProviderConfig,
  LlmProviderConfigRepository,
} from "../../application/utterance/types";

const SECRET_FIELD_NAMES = new Set([
  "apiKey",
  "api_key",
  "authorization",
  "password",
  "refreshToken",
  "refresh_token",
  "secret",
  "token",
  "userSecret",
  "user_secret",
]);

function assertNoSecretFields(value: unknown, path = "config") {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoSecretFields(entry, `${path}[${index}]`));
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  for (const [key, entry] of Object.entries(value)) {
    if (SECRET_FIELD_NAMES.has(key)) {
      throw new Error(`${path}.${key} must not be stored in non-secret provider config.`);
    }

    assertNoSecretFields(entry, `${path}.${key}`);
  }
}

export function assertNonSecretLlmProviderConfig(config: LlmProviderConfig) {
  assertNoSecretFields(config);
}

export function createNonSecretLlmProviderConfigRepository(
  initialConfig: LlmProviderConfig,
): LlmProviderConfigRepository {
  assertNonSecretLlmProviderConfig(initialConfig);
  let currentConfig = { ...initialConfig };

  return {
    async readConfig() {
      return { ...currentConfig };
    },
    async writeConfig(config) {
      assertNonSecretLlmProviderConfig(config);
      currentConfig = { ...config };
    },
  };
}
