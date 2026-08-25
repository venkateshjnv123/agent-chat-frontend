"use client";

import { useInfiniteQuery, useMutation } from "@tanstack/react-query";

import { listMessages, sendMessage } from "@/lib/api/messages";
import { useApiClient } from "@/lib/api/useApiClient";

import { flattenNewestFirstPages } from "./pagination";
import { queryKeys } from "./queryKeys";

export function useMessages(chatId: string) {
  const client = useApiClient();
  const query = useInfiniteQuery({
    queryKey: queryKeys.messages(chatId),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      listMessages(client, chatId, pageParam, signal),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: chatId.length > 0,
  });

  return {
    ...query,
    messages: flattenNewestFirstPages(query.data?.pages ?? []),
  };
}

export function useSendMessage() {
  const client = useApiClient();

  return useMutation({
    mutationFn: (input: Parameters<typeof sendMessage>[1]) =>
      sendMessage(client, input),
  });
}
