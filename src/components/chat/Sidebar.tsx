"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { LineIcon, MagicaMark, type IconName } from "@/components/ui/LineIcon";
import { formatCreditBalance } from "@/lib/credits/format";
import { useChats } from "@/queries/useChats";
import { useCredits } from "@/queries/useCredits";

type SidebarProps = {
  currentChatId?: string;
  activeItem?: "chat" | "tasks" | "usage";
  mobile?: boolean;
  onNavigate?: () => void;
};

const NAV_ITEMS: ReadonlyArray<{
  label: string;
  icon: IconName;
  href?: string;
}> = [
  { label: "Tasks", icon: "grid", href: "/tasks" },
  { label: "Projects", icon: "folder" },
  { label: "Library", icon: "library" },
  { label: "Tools", icon: "tools" },
  { label: "API/MCP", icon: "code" },
  { label: "Unfair Advantage", icon: "rocket" },
];

export function Sidebar({
  currentChatId,
  activeItem = "chat",
  mobile = false,
  onNavigate,
}: SidebarProps) {
  const chats = useChats();
  const credits = useCredits();

  return (
    <aside
      className={`${mobile ? "flex" : "hidden md:flex"} h-full min-h-0 w-[286px] shrink-0 flex-col overflow-hidden rounded-tr-[28px] border-r border-black/8 bg-[#f4f4f2] px-3.5 pt-4 pb-3 text-[#2b2b28]`}
    >
      <div className="flex h-10 items-center px-2">
        <Link
          href="/chat"
          onClick={onNavigate}
          aria-label="Magica home"
          className="flex items-center gap-2.5"
        >
          <MagicaMark className="size-[23px]" />
          <span className="text-[20px] font-semibold tracking-[-0.04em]">
            Magica
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label="Search"
            className="grid size-8 place-items-center rounded-lg text-[#777772] hover:bg-black/5"
          >
            <LineIcon name="search" className="size-[18px]" />
          </button>
          <button
            type="button"
            aria-label="Collapse sidebar"
            className="grid size-8 place-items-center rounded-lg text-[#777772] hover:bg-black/5"
          >
            <LineIcon name="panel" className="size-[18px]" />
          </button>
        </div>
      </div>

      <nav className="mt-5 space-y-1" aria-label="Workspace navigation">
        <Link
          href="/chat"
          onClick={onNavigate}
          aria-current={
            activeItem === "chat" && !currentChatId ? "page" : undefined
          }
          className={`flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] font-medium ${
            activeItem === "chat" && !currentChatId
              ? "border border-[#5f5af5] bg-white text-[#3b38c9] shadow-[0_1px_2px_rgba(0,0,0,.04)]"
              : "hover:bg-black/[0.045]"
          }`}
        >
          <span className="grid size-[19px] place-items-center rounded-full border border-current">
            <LineIcon name="plus" className="size-3" />
          </span>
          New task
        </Link>
        {NAV_ITEMS.map((item) => {
          const active = item.label === "Tasks" && activeItem === "tasks";
          const classes = `flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[14px] transition ${
            active
              ? "border border-[#5f5af5] bg-white font-medium text-[#3b38c9] shadow-[0_1px_2px_rgba(0,0,0,.04)]"
              : "text-[#464642] hover:bg-black/[0.04]"
          }`;
          const content = (
            <>
              <LineIcon name={item.icon} className="size-[19px] shrink-0" />
              <span>{item.label}</span>
            </>
          );

          return item.href ? (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className={classes}
              aria-current={active ? "page" : undefined}
            >
              {content}
            </Link>
          ) : (
            <button key={item.label} type="button" className={classes}>
              {content}
            </button>
          );
        })}
      </nav>

      <section className="mt-6 min-h-0 flex-1 overflow-hidden">
        <p className="px-3 text-[11px] font-semibold tracking-[0.08em] text-[#92928d] uppercase">
          Recent tasks
        </p>
        <nav
          className="mt-2 max-h-full space-y-0.5 overflow-y-auto"
          aria-label="Recent tasks"
        >
          {chats.isPending ? (
            <p className="px-3 py-2 text-[12px] text-black/40">
              Loading tasks…
            </p>
          ) : null}
          {chats.error ? (
            <p className="px-3 py-2 text-[12px] text-red-700">
              Could not load tasks.
            </p>
          ) : null}
          {!chats.isPending && !chats.error && chats.chats.length === 0 ? (
            <p className="px-3 py-2 text-[12px] text-black/40">No tasks yet</p>
          ) : null}
          {chats.chats.map((chat) => (
            <Link
              key={chat.id}
              href={`/chat/${encodeURIComponent(chat.id)}`}
              onClick={onNavigate}
              aria-current={chat.id === currentChatId ? "page" : undefined}
              className={`block truncate rounded-lg px-3 py-1.5 text-[12px] ${
                chat.id === currentChatId
                  ? "bg-white font-medium text-black shadow-sm"
                  : "text-[#777772] hover:bg-black/[0.04] hover:text-black"
              }`}
            >
              {chat.title ?? "Untitled task"}
            </Link>
          ))}
          {chats.hasNextPage ? (
            <button
              type="button"
              disabled={chats.isFetchingNextPage}
              onClick={() => void chats.fetchNextPage()}
              className="w-full rounded-lg px-3 py-2 text-left text-[11px] font-medium text-[#777772] hover:bg-black/[0.04] hover:text-black disabled:opacity-50"
            >
              {chats.isFetchingNextPage ? "Loading…" : "Load older tasks"}
            </button>
          ) : null}
        </nav>
      </section>

      <div className="mt-3 shrink-0 border-t border-black/8 pt-3">
        <button
          type="button"
          className="flex h-8 items-center gap-2 px-2 text-[12px] text-[#686863] hover:text-black"
        >
          <LineIcon name="menu" className="size-4" />
          Less
        </button>
        <Link
          href="/usage"
          onClick={onNavigate}
          className="mt-1 flex items-center justify-between px-2 py-1 text-[12px] text-[#5d5d58] hover:text-black"
        >
          <span>Available Credits</span>
          <span className="font-medium tabular-nums">
            {credits.isPending
              ? "…"
              : credits.data
                ? formatCreditBalance(credits.data.availableBalance)
                : "Unavailable"}
          </span>
        </Link>
        <div className="mx-2 mt-2 flex h-7 items-center justify-center rounded-full bg-[#dff7e6] text-[11px] font-medium text-[#34824a]">
          +15M credits on 24 Sep &apos;26
        </div>
        <button
          type="button"
          className="mt-2 h-9 w-full rounded-xl bg-[#292926] text-[12px] font-medium text-white hover:bg-black"
        >
          Add Credits
        </button>
        <div className="mt-2 grid grid-cols-2 gap-1">
          <button
            type="button"
            className="flex h-8 items-center justify-center gap-1.5 rounded-lg text-[11px] text-[#5f5f5a] hover:bg-black/5"
          >
            <LineIcon name="settings" className="size-4" /> Settings
          </button>
          <button
            type="button"
            className="flex h-8 items-center justify-center gap-1.5 rounded-lg text-[11px] text-[#5f5f5a] hover:bg-black/5"
          >
            <LineIcon name="bell" className="size-4" /> Updates
          </button>
        </div>
        <button
          type="button"
          className="mt-1 flex h-8 w-full items-center gap-2 rounded-lg px-2 text-[11px] text-[#5f5f5a] hover:bg-black/5"
        >
          <LineIcon name="users" className="size-4" /> Invite team members{" "}
          <span className="ml-auto">→</span>
        </button>
        <div className="mt-2 flex items-center gap-2 border-t border-black/8 px-2 pt-3">
          <div className="flex rounded-lg bg-black/[0.045] p-0.5 text-[#777772]">
            <button
              type="button"
              aria-label="System theme"
              className="grid size-6 place-items-center rounded-md bg-white shadow-sm"
            >
              <LineIcon name="monitor" className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Light theme"
              className="grid size-6 place-items-center rounded-md"
            >
              <LineIcon name="sun" className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Dark theme"
              className="grid size-6 place-items-center rounded-md"
            >
              ◐
            </button>
          </div>
          <div className="ml-auto flex min-w-0 items-center gap-2 text-[12px] text-[#444440]">
            <UserButton />
            <span className="truncate">Account</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
