"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { cancelRun, getRun, mintRealtimeToken } from "@/lib/api/runs";
import { useApiClient } from "@/lib/api/useApiClient";
import { isTerminalRunStatus } from "@/lib/runs/status";

import { queryKeys } from "./queryKeys";

export function useAgentRun(
  chatId: string | undefined,
  runId: string | undefined,
  pollWhileActive: boolean,
) {
  const client = useApiClient();

  return useQuery({
    queryKey: queryKeys.run(chatId ?? "", runId ?? ""),
    queryFn: ({ signal }) => getRun(client, chatId ?? "", runId ?? "", signal),
    enabled: Boolean(chatId && runId),
    refetchInterval: (query) => {
      if (isTerminalRunStatus(query.state.data?.status)) return false;
      return pollWhileActive ? 3_000 : false;
    },
  });
}

export function useRealtimeToken(runId: string | undefined, enabled: boolean) {
  const client = useApiClient();

  return useQuery({
    queryKey: queryKeys.realtimeToken(runId ?? ""),
    queryFn: ({ signal }) => mintRealtimeToken(client, runId ?? "", signal),
    enabled: Boolean(runId && enabled),
    staleTime: 0,
    retry: 3,
    retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4_000),
  });
}

export function useCancelRun() {
  const client = useApiClient();

  return useMutation({
    mutationFn: (runId: string) => cancelRun(client, runId),
  });
}
