import { describe, expect, it } from "vitest";
import type { LlmProviderConfig, UtteranceRequest } from "../../application/utterance/types";
import { createNonSecretLlmProviderConfigRepository } from "../config/nonSecretLlmProviderConfigRepository";
import { createMockProvider } from "./mockProvider";
import { createServerProxyProvider } from "./serverProxyProvider";
import { serializeForServerProxy } from "./serializers/serverProxySerializer";
import { createTemplateProvider } from "./templateProvider";

const baseRequest: UtteranceRequest = {
  requestId: "test-request",
  character: {
    id: "ryo",
    name: "Ryo",
    faithSummary: "神の声を慎重に受け止める。",
  },
  situation: {
    eventKind: "test",
    eventSummary: "試練が近づいている。",
  },
  constraints: {
    maxLength: 80,
    language: "ja",
    mode: "safe",
  },
};

describe("utterance provider skeletons", () => {
  it("mockProvider returns deterministic text without external calls", async () => {
    const provider = createMockProvider();

    await expect(provider.generate(baseRequest)).resolves.toEqual({
      status: "ok",
      providerKind: "mock",
      text: "Ryoは静かに状況を見つめている。",
    });
  });

  it("templateProvider renders event-specific template text", async () => {
    const provider = createTemplateProvider();
    const response = await provider.generate(baseRequest);

    expect(response.status).toBe("ok");
    expect(response.providerKind).toBe("template");
    expect(response.text).toBe("Ryoは、試練の気配を前にして拳を握った。");
  });

  it("serverProxyProvider stays unavailable until transport is implemented", async () => {
    const provider = createServerProxyProvider();
    const response = await provider.generate(baseRequest);

    expect(response).toEqual({
      status: "unavailable",
      providerKind: "serverProxy",
      text: null,
      reason: "serverProxyProvider is not configured.",
    });
  });

  it("serializes only provider-neutral request data for server proxy", () => {
    const payload = serializeForServerProxy(baseRequest, { proxyName: "local-proxy" });

    expect(payload).toEqual({
      proxyName: "local-proxy",
      requestId: baseRequest.requestId,
      character: baseRequest.character,
      situation: baseRequest.situation,
      constraints: baseRequest.constraints,
    });
    expect(JSON.stringify(payload)).not.toContain("apiKey");
    expect(JSON.stringify(payload)).not.toContain("userSecret");
  });

  it("non-secret config repository rejects secret-like fields", async () => {
    const initialConfig: LlmProviderConfig = {
      providerKind: "mock",
      maxOutputLength: 80,
      language: "ja",
      generationMode: "safe",
    };
    const repository = createNonSecretLlmProviderConfigRepository(initialConfig);

    await expect(repository.readConfig()).resolves.toEqual(initialConfig);
    await expect(
      repository.writeConfig({
        ...initialConfig,
        apiKey: "must-not-be-stored",
      } as LlmProviderConfig),
    ).rejects.toThrow("apiKey must not be stored");
  });
});
