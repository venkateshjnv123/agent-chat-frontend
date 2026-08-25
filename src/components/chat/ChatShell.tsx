"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { SendMessageRequest } from "@/contracts/generated";
import { formatCreditBalance } from "@/lib/credits/format";
import { useRunMonitor } from "@/lib/realtime/useRunMonitor";
import { isMessageWaitingForRun, isTerminalRunStatus } from "@/lib/runs/status";
import { queryKeys } from "@/queries/queryKeys";
import { useMessages, useSendMessage } from "@/queries/useMessages";
import { useCredits } from "@/queries/useCredits";
import { useCancelRun } from "@/queries/useRun";
import { useActiveRunStore } from "@/stores/activeRun";

import { Composer } from "./Composer";
import { ChatTopBar } from "./ChatTopBar";
import { MessageList } from "./MessageList";
import { PromptGallery } from "./PromptGallery";
import { Sidebar } from "./Sidebar";
import { MagicaMark } from "../ui/LineIcon";

type ChatShellProps = {
  chatId?: string;
  title?: string | null;
};

type PendingLogicalSend = {
  chatId?: string;
  content: string;
  attachmentIds: string[];
  idempotencyKey: string;
};

export function ChatShell({ chatId, title }: ChatShellProps = {}) {
  const queryClient = useQueryClient();
  const [createdChatId, setCreatedChatId] = useState<string>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentChatId = chatId ?? createdChatId;
  const messagesQuery = useMessages(currentChatId ?? "");
  const creditsQuery = useCredits();
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
        queryClient.invalidateQueries({ queryKey: queryKeys.credits }),
        queryClient.invalidateQueries({ queryKey: queryKeys.creditLedger }),
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

  const handleSend = async (rawContent: string, attachmentIds: string[]) => {
    const content = rawContent.trim();
    const previousSend = pendingSend.current;
    const idempotencyKey =
      previousSend !== null &&
      previousSend.chatId === currentChatId &&
      previousSend.content === content &&
      previousSend.attachmentIds.join("\u0000") === attachmentIds.join("\u0000")
        ? previousSend.idempotencyKey
        : crypto.randomUUID();
    const request: SendMessageRequest = {
      content,
      idempotencyKey,
      // Kept only for the current backend contract. Planning is not a
      // user-facing composer mode in the Magica reference.
      planMode: false,
      ...(attachmentIds.length > 0 ? { attachmentIds } : {}),
      ...(currentChatId ? { chatId: currentChatId } : {}),
    };

    pendingSend.current = {
      chatId: currentChatId,
      content,
      attachmentIds,
      idempotencyKey,
    };

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
  const formattedCredits = creditsQuery.data
    ? formatCreditBalance(creditsQuery.data.availableBalance)
    : creditsQuery.isPending
      ? "Credits…"
      : "Unavailable";

  return (
    <main className="flex h-dvh min-w-0 overflow-hidden border-t-2 border-[#2e3cff] bg-[#fafafa] text-[#22221f]">
      <Sidebar currentChatId={currentChatId} />

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close sidebar"
            className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative h-full w-[286px] shadow-2xl">
            <Sidebar
              currentChatId={currentChatId}
              mobile
              onNavigate={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <section className="flex min-w-0 flex-1 flex-col">
        <ChatTopBar
          credits={formattedCredits}
          showFolder={Boolean(currentChatId)}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        {currentChatId ? (
          <>
            <h1 className="sr-only">{title ?? "Task conversation"}</h1>
            {runId ? (
              <div className="pointer-events-none absolute top-5 left-1/2 z-10 -translate-x-1/2">
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-medium tracking-wide text-blue-700 uppercase">
                  {isStopping
                    ? "Stopping"
                    : isRunActive
                      ? (monitor.triggerStatus ?? "Working")
                      : (monitor.run?.status ?? "Complete")}
                </span>
              </div>
            ) : null}
            <MessageList
              messages={messagesQuery.messages}
              isLoading={messagesQuery.isPending}
              error={messagesQuery.error}
              hasOlder={messagesQuery.hasNextPage}
              isLoadingOlder={messagesQuery.isFetchingNextPage}
              onLoadOlder={() => void messagesQuery.fetchNextPage()}
              runMessage={monitor.run?.userMessage}
              realtimeDegraded={monitor.isRealtimeDegraded}
            />
            <Composer
              context="chat"
              isSending={sendMutation.isPending}
              isRunActive={isRunActive}
              isStopping={isStopping}
              error={visibleError}
              chatId={currentChatId}
              onSend={handleSend}
              onStop={handleStop}
            />
          </>
        ) : (
          <NewTaskWorkspace
            isSending={sendMutation.isPending}
            error={visibleError}
            onSend={handleSend}
            onStop={handleStop}
          />
        )}
      </section>
    </main>
  );
}

function NewTaskWorkspace({
  isSending,
  error,
  onSend,
  onStop,
}: {
  isSending: boolean;
  error: Error | null;
  onSend: (content: string, attachmentIds: string[]) => Promise<void>;
  onStop: () => Promise<void>;
}) {
  const [clock, setClock] = useState("");

  useEffect(() => {
    const update = () =>
      setClock(
        new Intl.DateTimeFormat(undefined, {
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date()),
      );

    update();
    const interval = window.setInterval(update, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 md:px-8">
      <section className="mx-auto pt-[52px] text-center">
        <MagicaMark className="mx-auto" />
        <p className="mt-4 h-5 text-[12px] text-[#969691]">{clock}</p>
        <h1 className="mt-2 text-[23px] font-medium tracking-[-0.025em]">
          Your AI worker
        </h1>
        <p className="mt-1.5 text-[14px] text-[#898984]">
          Work at the speed of thought.
        </p>
      </section>

      <div className="mt-[67px]">
        <Composer
          context="new"
          isSending={isSending}
          isRunActive={false}
          isStopping={false}
          error={error}
          onSend={onSend}
          onStop={onStop}
        />
      </div>
      <PromptGallery />
    </div>
  );
}
