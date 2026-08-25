import {
  ChatListResponseSchema,
  ChatSummarySchema,
} from "@/contracts/generated";

import type { ApiClient } from "./client";

export function listChats(
  client: ApiClient,
  cursor: string | null,
  signal?: AbortSignal,
) {
  return client.request(
    withQuery("api/v1/chats", { cursor }),
    ChatListResponseSchema,
    { signal },
  );
}

export function getChat(
  client: ApiClient,
  chatId: string,
  signal?: AbortSignal,
) {
  return client.request(
    `api/v1/chats/${encodeURIComponent(chatId)}`,
    ChatSummarySchema,
    { signal },
  );
}

function withQuery(
  path: string,
  values: Record<string, string | number | null | undefined>,
) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value !== null && value !== undefined) search.set(key, String(value));
  }

  const query = search.toString();

  return query ? `${path}?${query}` : path;
}
