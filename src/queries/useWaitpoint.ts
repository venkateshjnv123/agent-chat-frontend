"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  ResolveWaitpointRequest,
  WaitpointHistory,
} from "@/contracts/generated";
import { getRunWaitpoints, resolveWaitpoint } from "@/lib/api/waitpoints";
import { useApiClient } from "@/lib/api/useApiClient";

import { queryKeys } from "./queryKeys";

export function useWaitpoint(runId: string | null, pollWhileActive: boolean) {
  const client = useApiClient();

  return useQuery({
    queryKey: queryKeys.waitpoint(runId ?? ""),
    queryFn: ({ signal }) => getRunWaitpoints(client, runId ?? "", signal),
    enabled: Boolean(runId),
    retry: false,
    staleTime: pollWhileActive ? 0 : Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: pollWhileActive,
    // A REQUEST_CHANGES resolution can create a newer waitpoint on the same
    // run. Keep polling until the assistant message becomes terminal.
    refetchInterval: pollWhileActive ? 2_000 : false,
  });
}

type ResolveInput = {
  chatId: string;
  runId: string;
  waitpointId: string;
  request: ResolveWaitpointRequest;
};

export function useResolveWaitpoint() {
  const client = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ waitpointId, request }: ResolveInput) =>
      resolveWaitpoint(client, waitpointId, request),
    onSuccess: (response, variables) => {
      queryClient.setQueryData<WaitpointHistory | null>(
        queryKeys.waitpoint(variables.runId),
        (current) =>
          current
            ? {
                ...current,
                items: current.items.map((waitpoint) =>
                  waitpoint.id === response.waitpointId
                    ? {
                        ...waitpoint,
                        status: response.status,
                        resolution: response.resolution,
                        resolvedAt:
                          response.status === "RESOLVED"
                            ? (waitpoint.resolvedAt ?? new Date().toISOString())
                            : waitpoint.resolvedAt,
                      }
                    : waitpoint,
                ),
              }
            : current,
      );

      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.waitpoint(variables.runId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.run(variables.chatId, variables.runId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.messages(variables.chatId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.credits }),
        queryClient.invalidateQueries({ queryKey: queryKeys.creditLedger }),
      ]);
    },
  });
}
