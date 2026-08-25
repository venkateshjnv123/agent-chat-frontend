"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Sidebar } from "@/components/chat/Sidebar";
import { LineIcon } from "@/components/ui/LineIcon";
import { useChats } from "@/queries/useChats";

export function TasksScreen() {
  const chats = useChats();
  const [query, setQuery] = useState("");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const visibleChats = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return normalized
      ? chats.chats.filter((chat) =>
          (chat.title ?? "Untitled task")
            .toLocaleLowerCase()
            .includes(normalized),
        )
      : chats.chats;
  }, [chats.chats, query]);

  const toggleSelected = (chatId: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(chatId)) next.delete(chatId);
      else next.add(chatId);
      return next;
    });
  };

  return (
    <main className="flex h-dvh overflow-hidden border-t-2 border-[#2e3cff] bg-[#fafafa] text-[#252522]">
      <Sidebar activeItem="tasks" />
      <section className="min-w-0 flex-1 overflow-y-auto px-5 py-10 md:px-10 lg:px-12">
        <div className="mx-auto w-full max-w-[1380px]">
          <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-[32px] font-medium tracking-[-0.035em]">
              Tasks
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-[13px] text-[#555550] hover:bg-black/[0.04]"
              >
                <LineIcon name="filter" className="size-4" />
                Filter by
                <span className="font-medium text-[#282825]">All</span>
                <LineIcon name="chevron-down" className="size-3.5" />
              </button>
              <button
                type="button"
                aria-pressed={selecting}
                onClick={() => {
                  setSelecting((value) => !value);
                  setSelected(new Set());
                }}
                className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-[13px] text-[#555550] hover:bg-black/[0.04]"
              >
                <span className="grid size-4 place-items-center rounded border border-current text-[10px]">
                  ✓
                </span>
                Select tasks
              </button>
              <Link
                href="/chat"
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#272724] px-4 text-[13px] font-medium text-white shadow-sm hover:bg-black"
              >
                <LineIcon name="plus" className="size-4" />
                New task
              </Link>
            </div>
          </header>

          <label className="mt-7 flex h-[54px] items-center gap-3 rounded-[18px] border border-black/10 bg-white px-5 shadow-[0_1px_2px_rgba(0,0,0,.03)] focus-within:border-black/20">
            <LineIcon name="search" className="size-[19px] text-[#777772]" />
            <span className="sr-only">Search tasks</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tasks..."
              className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#a1a19c]"
            />
          </label>

          <section className="mt-7" aria-label="Task list">
            {chats.isPending ? <TaskListSkeleton /> : null}
            {chats.error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-12 text-center text-sm text-red-800">
                <p>Could not load tasks.</p>
                <button
                  type="button"
                  onClick={() => void chats.refetch()}
                  className="mt-2 font-medium underline underline-offset-2"
                >
                  Try again
                </button>
              </div>
            ) : null}
            {!chats.isPending && !chats.error && visibleChats.length === 0 ? (
              <div className="py-20 text-center">
                <h2 className="text-[16px] font-medium">
                  {query ? "No matching tasks" : "No tasks yet"}
                </h2>
                <p className="mt-2 text-[13px] text-[#858580]">
                  {query
                    ? "Try another search."
                    : "Start a new task to see it here."}
                </p>
              </div>
            ) : null}
            <ul className="divide-y divide-black/7">
              {visibleChats.map((chat) => (
                <li
                  key={chat.id}
                  className="flex min-h-[58px] items-center gap-3"
                >
                  {selecting ? (
                    <button
                      type="button"
                      aria-label={`Select ${chat.title ?? "Untitled task"}`}
                      aria-pressed={selected.has(chat.id)}
                      onClick={() => toggleSelected(chat.id)}
                      className={`grid size-4 shrink-0 place-items-center rounded border text-[10px] ${selected.has(chat.id) ? "border-[#3434d4] bg-[#3434d4] text-white" : "border-black/25"}`}
                    >
                      {selected.has(chat.id) ? "✓" : null}
                    </button>
                  ) : null}
                  <Link
                    href={`/chat/${encodeURIComponent(chat.id)}`}
                    className="flex min-w-0 flex-1 items-center justify-between gap-6 py-4 text-[13px] hover:text-black"
                  >
                    <span className="truncate text-[#3f3f3b]">
                      {chat.title ?? "Untitled task"}
                    </span>
                    <time
                      dateTime={chat.updatedAt}
                      className="shrink-0 text-[12px] text-[#92928d]"
                    >
                      {formatRelative(chat.updatedAt)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
            {chats.hasNextPage ? (
              <button
                type="button"
                disabled={chats.isFetchingNextPage}
                onClick={() => void chats.fetchNextPage()}
                className="mt-4 rounded-xl border border-black/10 bg-white px-4 py-2 text-[12px] text-[#555550] disabled:opacity-50"
              >
                {chats.isFetchingNextPage ? "Loading…" : "Load older tasks"}
              </button>
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}

function TaskListSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading tasks"
      className="animate-pulse divide-y divide-black/7"
    >
      {[0, 1, 2].map((item) => (
        <div key={item} className="flex h-[58px] items-center justify-between">
          <span className="h-3 w-56 rounded bg-black/8" />
          <span className="h-3 w-14 rounded bg-black/6" />
        </div>
      ))}
    </div>
  );
}

function formatRelative(value: string) {
  const then = new Date(value).getTime();
  const elapsed = Math.max(0, Date.now() - then);
  const minutes = Math.floor(elapsed / 60_000);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}
