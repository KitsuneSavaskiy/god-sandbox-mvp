import type { UtteranceRequest } from "../../../application/utterance/types";

export interface ServerProxySerializationOptions {
  proxyName: string;
}

export interface ServerProxyUtterancePayload {
  proxyName: string;
  requestId: string;
  character: UtteranceRequest["character"];
  situation: UtteranceRequest["situation"];
  constraints: UtteranceRequest["constraints"];
}

export function serializeForServerProxy(
  request: UtteranceRequest,
  options: ServerProxySerializationOptions,
): ServerProxyUtterancePayload {
  return {
    proxyName: options.proxyName,
    requestId: request.requestId,
    character: request.character,
    situation: request.situation,
    constraints: request.constraints,
  };
}
