import {
  MessageListResponseSchema,
  SendMessageRequestSchema,
  SendMessageResponseSchema,
  type SendMessageRequest,
} from "@/contracts/generated";

import type { ApiClient } from "./client";

export function listMessages(
  client: ApiClient,
  chatId: string,
  cursor: string | null,
  signal?: AbortSignal,
) {
  const search = new URLSearchParams({ limit: "50" });

  if (cursor) search.set("cursor", cursor);

  return client.request(
    `api/v1/chats/${encodeURIComponent(chatId)}/messages?${search.toString()}`,
    MessageListResponseSchema,
    { signal },
  );
}

export function sendMessage(
  client: ApiClient,
  input: SendMessageRequest,
  signal?: AbortSignal,
) {
  const request = SendMessageRequestSchema.parse(input);

  return client.request("api/v1/messages", SendMessageResponseSchema, {
    method: "POST",
    body: JSON.stringify(request),
    idempotencyKey: request.idempotencyKey,
    signal,
  });
}
