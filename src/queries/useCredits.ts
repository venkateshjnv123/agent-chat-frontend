"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { getCredits, listCreditLedger } from "@/lib/api/credits";
import { useApiClient } from "@/lib/api/useApiClient";

import { flattenNewestFirstPages } from "./pagination";
import { queryKeys } from "./queryKeys";

export function useCredits() {
  const client = useApiClient();

  return useQuery({
    queryKey: queryKeys.credits,
    queryFn: ({ signal }) => getCredits(client, signal),
  });
}

export function useCreditLedger() {
  const client = useApiClient();
  const query = useInfiniteQuery({
    queryKey: queryKeys.creditLedger,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      listCreditLedger(client, pageParam, signal),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
  });

  return {
    ...query,
    entries: flattenNewestFirstPages(query.data?.pages ?? []),
  };
}
