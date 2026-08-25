"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { useChats } from "@/queries/useChats";

export function Sidebar({ currentChatId }: { currentChatId?: string }) {
  const chats = useChats();

  return (
    <aside className="hidden h-dvh min-h-0 border-r border-black/8 bg-[#efefec] p-3 md:flex md:flex-col">
      <Link
        href="/chat"
        className="rounded-xl border border-black/10 bg-white px-4 py-3 text-left text-sm font-medium shadow-sm transition hover:bg-black/[0.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      >
        + New chat
      </Link>

      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        <p className="px-2 text-[11px] font-semibold tracking-wide text-black/40 uppercase">
          Recent tasks
        </p>
        <nav
          className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto"
          aria-label="Recent chats"
        >
          {chats.isPending ? (
            <p className="px-2 py-3 text-xs text-black/45">Loading chats…</p>
          ) : null}
          {chats.error ? (
            <div className="px-2 py-3 text-xs text-red-700">
              <p>Could not load chats.</p>
              <button
                type="button"
                className="mt-1 font-medium underline underline-offset-2"
                onClick={() => void chats.refetch()}
              >
                Try again
              </button>
            </div>
          ) : null}
          {!chats.isPending && !chats.error && chats.chats.length === 0 ? (
            <p className="px-2 py-3 text-xs text-black/45">No tasks yet</p>
          ) : null}
          {chats.chats.map((chat) => {
            const active = chat.id === currentChatId;

            return (
              <Link
                key={chat.id}
                href={`/chat/${encodeURIComponent(chat.id)}`}
                aria-current={active ? "page" : undefined}
                className={`block truncate rounded-lg px-2.5 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${
                  active
                    ? "bg-white font-medium text-black shadow-sm"
                    : "text-black/65 hover:bg-black/5"
                }`}
              >
                {chat.title ?? "Untitled task"}
              </Link>
            );
          })}
          {chats.hasNextPage ? (
            <button
              type="button"
              className="w-full px-2.5 py-2 text-left text-xs font-medium text-black/50 hover:text-black"
              disabled={chats.isFetchingNextPage}
              onClick={() => void chats.fetchNextPage()}
            >
              {chats.isFetchingNextPage ? "Loading…" : "Load older"}
            </button>
          ) : null}
        </nav>
      </div>

      <div className="mt-3 border-t border-black/8 pt-3">
        <Link
          href="/usage"
          className="flex items-center justify-between rounded-lg px-2.5 py-2 text-sm text-black/60 hover:bg-black/5"
        >
          <span>Available Credits</span>
          <span className="text-xs">0.00M</span>
        </Link>
        <div className="mt-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-black/60">
          <UserButton />
          <span>Account</span>
        </div>
      </div>
    </aside>
  );
}
