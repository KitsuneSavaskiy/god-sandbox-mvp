import type { LlmProvider, UtteranceRequest, UtteranceResponse } from "../../application/utterance/types";
import { serializeForServerProxy } from "./serializers/serverProxySerializer";

export interface ServerProxyProviderOptions {
  proxyName?: string;
  endpointPath?: string;
}

export function createServerProxyProvider(options: ServerProxyProviderOptions = {}): LlmProvider {
  return {
    kind: "serverProxy",
    async generate(request: UtteranceRequest): Promise<UtteranceResponse> {
      const payload = serializeForServerProxy(request, {
        proxyName: options.proxyName ?? "default-server-proxy",
      });

      void payload;

      return {
        status: "unavailable",
        providerKind: "serverProxy",
        text: null,
        reason: options.endpointPath
          ? "serverProxyProvider transport is not implemented in this PBI."
          : "serverProxyProvider is not configured.",
      };
    },
  };
}
