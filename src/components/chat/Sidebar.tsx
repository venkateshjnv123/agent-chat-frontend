"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

import { LineIcon, type IconName } from "@/components/ui/LineIcon";
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
  const { user } = useUser();

  return (
    <aside
      className={`${mobile ? "flex h-full w-[240px]" : "my-2 ml-2 hidden h-[calc(100%-1rem)] w-[240px] rounded-xl md:flex"} min-h-0 shrink-0 flex-col overflow-hidden bg-[#fafafa] px-2 pb-2 text-[#1b1b1b]`}
    >
      <div className="flex h-[52px] shrink-0 items-center px-1">
        <Link
          href="/chat"
          onClick={onNavigate}
          aria-label="Magica home"
          className="flex h-8 items-center px-1"
        >
          <Image
            unoptimized
            src="https://app.magica.com/galaxy.png"
            alt="Magica"
            width={80}
            height={20}
            className="h-5 w-20 object-contain object-left"
          />
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label="Search"
            className="grid size-7 place-items-center rounded-lg text-[#343434] hover:bg-[#f1f1f1]"
          >
            <LineIcon name="search" className="size-[18px]" />
          </button>
          <button
            type="button"
            aria-label="Collapse sidebar"
            className="grid size-7 place-items-center rounded-lg text-[#343434] hover:bg-[#f1f1f1]"
          >
            <LineIcon name="panel" className="size-[18px]" />
          </button>
        </div>
      </div>

      <nav className="space-y-1" aria-label="Workspace navigation">
        <Link
          href="/chat"
          onClick={onNavigate}
          aria-current={
            activeItem === "chat" && !currentChatId ? "page" : undefined
          }
          className="flex h-[34px] items-center gap-2.5 rounded-[10px] px-2 text-[14px] font-medium hover:bg-[#f1f1f1]"
        >
          <LineIcon name="plus" className="size-4 shrink-0" />
          New task
        </Link>
        {NAV_ITEMS.map((item) => {
          const active = item.label === "Tasks" && activeItem === "tasks";
          const classes = `flex h-[34px] w-full items-center gap-2.5 rounded-[10px] px-2 text-[14px] transition ${
            active
              ? "bg-[#f1f1f1] font-medium text-[#1b1b1b]"
              : "text-[#343434] hover:bg-[#f1f1f1]"
          }`;
          const content = (
            <>
              <LineIcon name={item.icon} className="size-4 shrink-0" />
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

      <section className="mt-4 min-h-0 flex-1 overflow-hidden">
        <p className="px-2 text-[12px] leading-4 font-normal text-[#585858]">
          Recent tasks
        </p>
        <nav
          className="mt-2 max-h-full space-y-0.5 overflow-x-hidden overflow-y-auto"
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
              className={`block h-8 truncate rounded-lg px-2 py-1.5 text-[13px] ${
                chat.id === currentChatId
                  ? "bg-[#f1f1f1] font-medium text-[#1b1b1b]"
                  : "text-[#585858] hover:bg-[#f1f1f1] hover:text-[#1b1b1b]"
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

      <div className="mt-3 shrink-0 border-t border-[#ededed] pt-3">
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
        <div className="mt-2 border-t border-black/8 pt-2">
          <div className="flex h-8 w-full items-center rounded-xl border border-[#ededed] bg-white p-0.5 text-[#777772]">
            <button
              type="button"
              aria-label="System theme"
              className="grid h-7 flex-1 place-items-center rounded-[10px] bg-[#f7f7f7]"
            >
              <LineIcon name="monitor" className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Light theme"
              className="grid h-7 flex-1 place-items-center rounded-[10px]"
            >
              <LineIcon name="sun" className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Dark theme"
              className="grid h-7 flex-1 place-items-center rounded-[10px]"
            >
              ◐
            </button>
          </div>
          <div className="mt-1 flex h-8 min-w-0 items-center rounded-xl border border-[#ededed] bg-white px-2 text-[12px] text-[#1b1b1b]">
            <UserButton />
            <span className="min-w-0 flex-1 truncate text-center font-medium">
              {user?.fullName ??
                user?.primaryEmailAddress?.emailAddress ??
                "Account"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
