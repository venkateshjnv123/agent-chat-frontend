import {
  ResolveWaitpointRequestSchema,
  ResolveWaitpointResponseSchema,
  WaitpointSchema,
  type ResolveWaitpointRequest,
} from "@/contracts/generated";

import { ApiError, type ApiClient } from "./client";

export async function getRunWaitpoint(
  client: ApiClient,
  runId: string,
  signal?: AbortSignal,
) {
  try {
    return await client.request(
      `api/v1/runs/${encodeURIComponent(runId)}/waitpoint`,
      WaitpointSchema,
      { signal },
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export function resolveWaitpoint(
  client: ApiClient,
  waitpointId: string,
  input: ResolveWaitpointRequest,
  signal?: AbortSignal,
) {
  const request = ResolveWaitpointRequestSchema.parse(input);

  return client.request(
    `api/v1/waitpoints/${encodeURIComponent(waitpointId)}/resolve`,
    ResolveWaitpointResponseSchema,
    {
      method: "POST",
      body: JSON.stringify(request),
      idempotencyKey: request.idempotencyKey,
      signal,
    },
  );
}
