"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { SendMessageRequest } from "@/contracts/generated";
import { useRunMonitor } from "@/lib/realtime/useRunMonitor";
import { isMessageWaitingForRun, isTerminalRunStatus } from "@/lib/runs/status";
import { queryKeys } from "@/queries/queryKeys";
import { useMessages, useSendMessage } from "@/queries/useMessages";
import { useCancelRun } from "@/queries/useRun";
import { useActiveRunStore } from "@/stores/activeRun";

import { Composer } from "./Composer";
import { MessageList } from "./MessageList";
import { Sidebar } from "./Sidebar";

type ChatShellProps = {
  chatId?: string;
  title?: string | null;
};

type PendingLogicalSend = {
  chatId?: string;
  content: string;
  idempotencyKey: string;
};

export function ChatShell({ chatId, title }: ChatShellProps = {}) {
  const queryClient = useQueryClient();
  const [createdChatId, setCreatedChatId] = useState<string>();
  const currentChatId = chatId ?? createdChatId;
  const messagesQuery = useMessages(currentChatId ?? "");
  const sendMutation = useSendMessage();
  const cancelMutation = useCancelRun();
  const activeHandle = useActiveRunStore((state) => state.handle);
  const setActiveHandle = useActiveRunStore((state) => state.setHandle);
  const clearActiveHandle = useActiveRunStore((state) => state.clearHandle);
  const pendingSend = useRef<PendingLogicalSend | null>(null);
  const [stoppingRunId, setStoppingRunId] = useState<string | null>(null);

  const persistedActiveRunId = useMemo(
    () =>
      messagesQuery.messages.find(
        (message) =>
          message.role === "ASSISTANT" &&
          message.runId &&
          isMessageWaitingForRun(message.status),
      )?.runId ?? undefined,
    [messagesQuery.messages],
  );
  const storedHandle =
    currentChatId && activeHandle?.chatId === currentChatId
      ? activeHandle
      : null;
  const runId = storedHandle?.runId ?? persistedActiveRunId;

  const reconcileTerminal = useCallback(
    (terminalRunId: string) => {
      clearActiveHandle(terminalRunId);
      setStoppingRunId((current) =>
        current === terminalRunId ? null : current,
      );

      if (!currentChatId) return;

      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.chats }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.chat(currentChatId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.messages(currentChatId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.run(currentChatId, terminalRunId),
        }),
      ]);
    },
    [currentChatId, clearActiveHandle, queryClient],
  );

  const monitor = useRunMonitor({
    chatId: currentChatId,
    runId,
    initialRealtimeRunId: storedHandle?.realtimeRunId,
    initialRealtimeToken: storedHandle?.realtimeToken,
    onTerminal: reconcileTerminal,
  });
  const isRunActive = Boolean(
    runId && !isTerminalRunStatus(monitor.run?.status),
  );
  const isStopping =
    cancelMutation.isPending ||
    stoppingRunId === runId ||
    monitor.run?.status === "CANCELLING";

  useEffect(() => {
    if (!currentChatId || !isRunActive) return;

    const reconcileMessages = () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages(currentChatId),
      });
    };

    reconcileMessages();
    const interval = window.setInterval(reconcileMessages, 2_000);

    return () => window.clearInterval(interval);
  }, [currentChatId, isRunActive, queryClient]);

  const handleSend = async (rawContent: string) => {
    const content = rawContent.trim();
    const previousSend = pendingSend.current;
    const idempotencyKey =
      previousSend !== null &&
      previousSend.chatId === currentChatId &&
      previousSend.content === content
        ? previousSend.idempotencyKey
        : crypto.randomUUID();
    const request: SendMessageRequest = {
      content,
      idempotencyKey,
      ...(currentChatId ? { chatId: currentChatId } : {}),
    };

    pendingSend.current = { chatId: currentChatId, content, idempotencyKey };

    const response = await sendMutation.mutateAsync(request);

    pendingSend.current = null;
    setActiveHandle({
      chatId: response.chatId,
      runId: response.runId,
      ...(response.realtimeRunId
        ? { realtimeRunId: response.realtimeRunId }
        : {}),
      realtimeToken: response.realtimeToken,
    });

    void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.messages(response.chatId),
    });

    if (!currentChatId) {
      setCreatedChatId(response.chatId);
      window.history.replaceState(
        window.history.state,
        "",
        `/chat/${encodeURIComponent(response.chatId)}`,
      );
    }
  };

  const handleStop = async () => {
    if (!runId) return;

    setStoppingRunId(runId);

    try {
      const response = await cancelMutation.mutateAsync(runId);

      if (isTerminalRunStatus(response.status)) {
        reconcileTerminal(runId);
      } else if (currentChatId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.run(currentChatId, runId),
        });
      }
    } catch (error) {
      setStoppingRunId((current) => (current === runId ? null : current));
      throw error;
    }
  };

  const visibleError = cancelMutation.error ?? sendMutation.error;

  return (
    <main className="grid h-dvh overflow-hidden bg-[#f7f7f5] text-[#22221f] md:grid-cols-[260px_1fr]">
      <Sidebar currentChatId={currentChatId} />

      <section className="flex min-h-0 min-w-0 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-black/8 px-4 md:px-6">
          <div className="min-w-0">
            <p className="text-sm font-medium">Agent Chat</p>
            <p className="truncate text-xs text-black/45">
              {currentChatId ? (title ?? "Conversation") : "New conversation"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {runId ? (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                {isStopping
                  ? "Stopping"
                  : isRunActive
                    ? (monitor.triggerStatus ?? "Working")
                    : (monitor.run?.status ?? "Complete")}
              </span>
            ) : null}
            <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs text-black/55">
              0 credits used
            </span>
          </div>
        </header>

        <MessageList
          messages={messagesQuery.messages}
          isLoading={Boolean(currentChatId && messagesQuery.isPending)}
          error={messagesQuery.error}
          hasOlder={messagesQuery.hasNextPage}
          isLoadingOlder={messagesQuery.isFetchingNextPage}
          onLoadOlder={() => void messagesQuery.fetchNextPage()}
          runMessage={monitor.run?.userMessage}
          realtimeDegraded={monitor.isRealtimeDegraded}
        />

        <Composer
          context={currentChatId ? "chat" : "new"}
          isSending={sendMutation.isPending}
          isRunActive={isRunActive}
          isStopping={isStopping}
          error={visibleError}
          onSend={handleSend}
          onStop={handleStop}
        />
      </section>
    </main>
  );
}
