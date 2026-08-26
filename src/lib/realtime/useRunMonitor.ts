"use client";

import { useRealtimeRunWithStreams } from "@trigger.dev/react-hooks";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AgentActivityEventSchema,
  ASSISTANT_ACTIVITY_STREAM,
  ASSISTANT_TEXT_STREAM,
  AssistantTextDeltaSchema,
  RunMetadataSchema,
} from "@/contracts/generated";
import { isTerminalRunStatus } from "@/lib/runs/status";
import { useAgentRun, useRealtimeToken } from "@/queries/useRun";
import {
  buildStreamSnapshot,
  useAssistantStreamStore,
} from "@/stores/assistantStream";

type UseRunMonitorInput = {
  chatId?: string;
  runId?: string;
  messageId?: string;
  initialRealtimeRunId?: string;
  initialRealtimeToken?: string;
  onTerminal: (runId: string) => void;
};

const MAX_TOKEN_REFRESH_ATTEMPTS = 3;

export function useRunMonitor({
  chatId,
  runId,
  messageId,
  initialRealtimeRunId,
  initialRealtimeToken,
  onTerminal,
}: UseRunMonitorInput) {
  const terminalNotifiedFor = useRef<string | null>(null);
  const reconnectAttempts = useRef(0);
  const subscribedRun = useRef<string | undefined>(undefined);
  const [subscriptionGeneration, setSubscriptionGeneration] = useState(0);
  const [subscriptionEnabled, setSubscriptionEnabled] = useState(true);
  const tokenQuery = useRealtimeToken(runId, Boolean(runId));
  const { data: tokenData, refetch: refetchToken } = tokenQuery;
  const accessToken = tokenData?.realtimeToken ?? initialRealtimeToken;
  const realtimeRunId = tokenData?.realtimeRunId ?? initialRealtimeRunId;
  const hasRealtimeScope = Boolean(realtimeRunId && accessToken);
  const notifyTerminal = useCallback(() => {
    if (!runId) return;

    const key = `${runId}:${realtimeRunId ?? "rest"}`;
    if (terminalNotifiedFor.current === key) return;

    terminalNotifiedFor.current = key;
    onTerminal(runId);
  }, [onTerminal, realtimeRunId, runId]);

  const realtime = useRealtimeRunWithStreams(realtimeRunId, {
    id: `agent-turn:${realtimeRunId ?? "pending"}:${subscriptionGeneration}`,
    accessToken,
    enabled: hasRealtimeScope && subscriptionEnabled,
    skipColumns: ["payload", "output", "runTags"],
    throttleInMs: 16,
    onComplete: (_run, error) => {
      if (!error) notifyTerminal();
    },
  });

  const rawTextParts: unknown = realtime.streams[ASSISTANT_TEXT_STREAM];
  const rawActivityParts: unknown = realtime.streams[ASSISTANT_ACTIVITY_STREAM];
  const textDeltas = useMemo(
    () => parseTextDeltas(rawTextParts),
    [rawTextParts],
  );
  const activity = useMemo(
    () => parseActivity(rawActivityParts),
    [rawActivityParts],
  );
  const runMetadata = useMemo(() => {
    const parsed = RunMetadataSchema.safeParse(realtime.run?.metadata);
    return parsed.success ? parsed.data : null;
  }, [realtime.run?.metadata]);
  const replaceSnapshot = useAssistantStreamStore(
    (state) => state.replaceSnapshot,
  );
  const streamBuffer = useAssistantStreamStore((state) =>
    runId ? state.byRunId[runId] : undefined,
  );

  useEffect(() => {
    if (!runId || !messageId) return;

    replaceSnapshot(
      buildStreamSnapshot({
        runId,
        messageId,
        textDeltas,
        activity,
        metadata: runMetadata,
      }),
    );
  }, [activity, messageId, replaceSnapshot, runId, runMetadata, textDeltas]);

  useEffect(() => {
    if (subscribedRun.current === realtimeRunId) return;

    subscribedRun.current = realtimeRunId;
    reconnectAttempts.current = 0;
    terminalNotifiedFor.current = null;
    const timeout = window.setTimeout(() => setSubscriptionEnabled(true), 0);
    return () => window.clearTimeout(timeout);
  }, [realtimeRunId]);

  useEffect(() => {
    const receivedRealtimeData =
      Boolean(realtime.run) || textDeltas.length > 0 || activity.length > 0;

    if (!receivedRealtimeData) return;

    reconnectAttempts.current = 0;
  }, [activity.length, realtime.run, textDeltas.length]);

  useEffect(() => {
    if (!runId || !realtime.error) return;

    let cancelled = false;
    let timeout: number | undefined;

    const refresh = async () => {
      if (
        cancelled ||
        reconnectAttempts.current >= MAX_TOKEN_REFRESH_ATTEMPTS
      ) {
        return;
      }

      setSubscriptionEnabled(false);
      reconnectAttempts.current += 1;
      const result = await refetchToken();

      if (cancelled) return;

      if (!result.error) {
        setSubscriptionGeneration((current) => current + 1);
        setSubscriptionEnabled(true);
        return;
      }

      if (reconnectAttempts.current < MAX_TOKEN_REFRESH_ATTEMPTS) {
        timeout = window.setTimeout(
          () => void refresh(),
          Math.min(500 * 2 ** reconnectAttempts.current, 4_000),
        );
      }
    };

    timeout = window.setTimeout(() => void refresh(), 500);

    return () => {
      cancelled = true;
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
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

  const realtimeDegraded = Boolean(
    runId && (!hasRealtimeScope || realtime.error || !subscriptionEnabled),
  );
  const runQuery = useAgentRun(chatId, runId, realtimeDegraded);

  useEffect(() => {
    if (realtime.run?.finishedAt) notifyTerminal();
  }, [notifyTerminal, realtime.run?.finishedAt]);

  useEffect(() => {
    if (
      realtimeDegraded &&
      runId &&
      isTerminalRunStatus(runQuery.data?.status)
    ) {
      notifyTerminal();
    }
  }, [notifyTerminal, realtimeDegraded, runId, runQuery.data?.status]);

  return {
    run: runQuery.data,
    runMetadata,
    streamBuffer,
    triggerStatus: realtime.run?.status,
    isRealtimeDegraded: realtimeDegraded,
    realtimeError: realtime.error,
  };
}

function parseTextDeltas(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.flatMap((part) => {
    const parsed = AssistantTextDeltaSchema.safeParse(part);
    return parsed.success ? [parsed.data] : [];
  });
}

function parseActivity(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.flatMap((part) => {
    const parsed = AgentActivityEventSchema.safeParse(part);
    return parsed.success ? [parsed.data] : [];
  });
}
