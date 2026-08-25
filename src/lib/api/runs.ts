import {
  AgentRunStateSchema,
  CancelRunResponseSchema,
  RealtimeTokenResponseSchema,
} from "@/contracts/generated";

import type { ApiClient } from "./client";

export function getRun(
  client: ApiClient,
  chatId: string,
  runId: string,
  signal?: AbortSignal,
) {
  return client.request(
    `api/v1/chats/${encodeURIComponent(chatId)}/runs/${encodeURIComponent(runId)}`,
    AgentRunStateSchema,
    { signal },
  );
}

export function mintRealtimeToken(
  client: ApiClient,
  runId: string,
  signal?: AbortSignal,
) {
  return client.request(
    `api/v1/runs/${encodeURIComponent(runId)}/realtime-token`,
    RealtimeTokenResponseSchema,
    { method: "POST", signal },
  );
}

export function cancelRun(
  client: ApiClient,
  runId: string,
  signal?: AbortSignal,
) {
  return client.request(
    `api/v1/runs/${encodeURIComponent(runId)}/cancel`,
    CancelRunResponseSchema,
    { method: "POST", signal },
  );
}
