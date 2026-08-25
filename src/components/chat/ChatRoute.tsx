"use client";

import Link from "next/link";

import { RouteState } from "@/components/routes/RouteState";
import { ApiError } from "@/lib/api/client";
import { useChat } from "@/queries/useChats";

import { ChatShell } from "./ChatShell";

export function ChatRoute({ chatId }: { chatId: string }) {
  const chat = useChat(chatId);

  if (chat.isPending) {
    return (
      <RouteState title="Loading chat" description="Restoring conversation…" />
    );
  }

  if (chat.error) {
    if (chat.error instanceof ApiError && chat.error.status === 404) {
      return (
        <RouteState
          title="Chat not found"
          description="This chat does not exist or is not available to your account."
          action={
            <Link
              href="/chat"
              className="rounded-xl bg-[#252520] px-4 py-2 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            >
              Start new chat
            </Link>
          }
        />
      );
    }

    return (
      <RouteState
        title="Could not load chat"
        description={
          chat.error instanceof ApiError && chat.error.traceId
            ? `Try again. Reference: ${chat.error.traceId}`
            : "Connection failed before this chat could be restored."
        }
        action={
          <button
            type="button"
            onClick={() => void chat.refetch()}
            className="rounded-xl bg-[#252520] px-4 py-2 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            Try again
          </button>
        }
      />
    );
  }

  return <ChatShell chatId={chatId} title={chat.data.title} />;
}
