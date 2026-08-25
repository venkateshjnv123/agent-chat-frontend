"use client";

import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { useEffect, useRef } from "react";

import { isTerminalRunStatus } from "@/lib/runs/status";
import { useAgentRun, useRealtimeToken } from "@/queries/useRun";

type UseRunMonitorInput = {
  chatId?: string;
  runId?: string;
  initialRealtimeRunId?: string;
  initialRealtimeToken?: string;
  onTerminal: (runId: string) => void;
};

const MAX_TOKEN_REFRESH_ATTEMPTS = 3;

export function useRunMonitor({
  chatId,
  runId,
  initialRealtimeRunId,
  initialRealtimeToken,
  onTerminal,
}: UseRunMonitorInput) {
  const refreshAttempts = useRef({ runId: null as string | null, count: 0 });
  const terminalNotifiedFor = useRef<string | null>(null);
  const tokenQuery = useRealtimeToken(runId, Boolean(runId));
  const { data: tokenData, refetch: refetchToken } = tokenQuery;
  const accessToken = tokenData?.realtimeToken ?? initialRealtimeToken;
  const realtimeRunId = tokenData?.realtimeRunId ?? initialRealtimeRunId;

  const realtime = useRealtimeRun(realtimeRunId, {
    accessToken,
    enabled: Boolean(realtimeRunId && accessToken),
    skipColumns: ["payload", "output", "runTags"],
    onComplete: (_run, error) => {
      if (!error && runId && terminalNotifiedFor.current !== runId) {
        terminalNotifiedFor.current = runId;
        onTerminal(runId);
      }
    },
  });

  const realtimeDegraded = Boolean(
    runId && (!realtimeRunId || !accessToken || realtime.error),
  );
  const runQuery = useAgentRun(chatId, runId, realtimeDegraded);

  useEffect(() => {
    if (refreshAttempts.current.runId !== runId) {
      refreshAttempts.current = { runId: runId ?? null, count: 0 };
    }

    if (
      !runId ||
      !realtime.error ||
      refreshAttempts.current.count >= MAX_TOKEN_REFRESH_ATTEMPTS
    ) {
      return;
    }

    const attempt = refreshAttempts.current.count++;
    const timeout = window.setTimeout(
      () => {
        void refetchToken();
      },
      Math.min(500 * 2 ** attempt, 4_000),
    );

    return () => window.clearTimeout(timeout);
  }, [realtime.error, refetchToken, runId]);

  useEffect(() => {
    const expiresAt = tokenData?.expiresAt;

    if (!expiresAt || !runId) return;

    const refreshIn = Math.max(
      new Date(expiresAt).getTime() - Date.now() - 30_000,
      0,
    );
    const timeout = window.setTimeout(() => {
      void refetchToken();
    }, refreshIn);

    return () => window.clearTimeout(timeout);
  }, [refetchToken, runId, tokenData?.expiresAt]);

  useEffect(() => {
    if (
      runId &&
      isTerminalRunStatus(runQuery.data?.status) &&
      terminalNotifiedFor.current !== runId
    ) {
      terminalNotifiedFor.current = runId;
      onTerminal(runId);
    }
  }, [onTerminal, runId, runQuery.data?.status]);

  return {
    run: runQuery.data,
    triggerStatus: realtime.run?.status,
    isRealtimeDegraded: realtimeDegraded,
    realtimeError: realtime.error,
  };
}
