"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { getChat, listChats } from "@/lib/api/chats";
import { useApiClient } from "@/lib/api/useApiClient";

import { flattenNewestFirstPages } from "./pagination";
import { queryKeys } from "./queryKeys";

export function useChats() {
  const client = useApiClient();
  const query = useInfiniteQuery({
    queryKey: queryKeys.chats,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => listChats(client, pageParam, signal),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
  });

  return {
    ...query,
    chats: flattenNewestFirstPages(query.data?.pages ?? []),
  };
}

export function useChat(chatId: string) {
  const client = useApiClient();

  return useQuery({
    queryKey: queryKeys.chat(chatId),
    queryFn: ({ signal }) => getChat(client, chatId, signal),
    enabled: chatId.length > 0,
  });
}
