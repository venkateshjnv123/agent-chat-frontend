"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import type { Message } from "@/contracts/generated";
import { queryKeys } from "@/queries/queryKeys";
import { useAgentRun, useRetryRun } from "@/queries/useRun";
import { useActiveRunStore } from "@/stores/activeRun";
import { useAssistantStreamStore } from "@/stores/assistantStream";

export function RetryTurn({ message }: { message: Message }) {
  const queryClient = useQueryClient();
  const runQuery = useAgentRun(
    message.chatId,
    message.runId ?? undefined,
    false,
  );
  const retryMutation = useRetryRun();
  const setActiveHandle = useActiveRunStore((state) => state.setHandle);
  const clearAssistantStream = useAssistantStreamStore((state) => state.clear);
  const [notice, setNotice] = useState<string | null>(null);

  if (!message.runId || runQuery.isPending || runQuery.error) return null;
  const run = runQuery.data;
  if (run.status !== "FAILED") return null;

  if (!run.retryable) {
    return <FailureNotice message={run.userMessage} retryable={false} />;
  }

  const retry = async () => {
    setNotice(null);

    try {
      const response = await retryMutation.mutateAsync(run.id);

      if (!response.retried) {
        setNotice(reasonLabel(response.reason));
        void runQuery.refetch();
        return;
      }

      clearAssistantStream(response.runId);
      setActiveHandle({
        chatId: response.chatId,
        runId: response.runId,
        messageId: response.messageId,
        ...(response.realtimeRunId
          ? { realtimeRunId: response.realtimeRunId }
          : {}),
        realtimeToken: response.realtimeToken,
      });
      setNotice("Retry started.");
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.run(response.chatId, response.runId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.messages(response.chatId),
        }),
      ]);
    } catch {
      // Mutation error renders below. Button stays available for safe retry.
    }
  };

  return (
    <div className="mt-2 rounded-xl border border-red-200 bg-red-50/70 px-3 py-2.5">
      <p className="text-[12px] leading-5 text-red-900">
        {run.userMessage ?? "This turn failed before it finished."}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={retryMutation.isPending}
          onClick={() => void retry()}
          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[12px] font-medium text-red-800 hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"
        >
          {retryMutation.isPending ? "Retrying…" : "Retry turn"}
        </button>
        {notice ? <p className="text-[11px] text-black/45">{notice}</p> : null}
        {retryMutation.error ? (
          <p className="text-[11px] text-red-700">
            {retryMutation.error.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function FailureNotice({
  message,
  retryable,
}: {
  message: string | null;
  retryable: boolean;
}) {
  return (
    <div className="mt-2 rounded-xl border border-red-200 bg-red-50/70 px-3 py-2.5">
      <p className="text-[12px] leading-5 text-red-900">
        {message ?? "This turn failed before it finished."}
      </p>
      {!retryable ? (
        <p className="mt-1 text-[11px] text-red-700/70">
          Retry unavailable for this failure.
        </p>
      ) : null}
    </div>
  );
}

function reasonLabel(
  reason: "not_retryable" | "run_active" | "already_retried" | null,
) {
  switch (reason) {
    case "run_active":
      return "Run already active.";
    case "already_retried":
      return "This turn was already retried.";
    default:
      return "This failure can no longer retry.";
  }
}
