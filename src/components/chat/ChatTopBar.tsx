import Link from "next/link";

import { LineIcon } from "@/components/ui/LineIcon";

type ChatTopBarProps = {
  credits: string;
  showFolder: boolean;
  onOpenSidebar: () => void;
};

export function ChatTopBar({
  credits,
  showFolder,
  onOpenSidebar,
}: ChatTopBarProps) {
  return (
    <header className="flex h-[62px] shrink-0 items-center justify-between px-5 md:px-7">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Open sidebar"
          onClick={onOpenSidebar}
          className="grid size-9 place-items-center rounded-xl text-[#5f5f5b] hover:bg-black/[0.035] md:hidden"
        >
          <LineIcon name="panel" className="size-[19px]" />
        </button>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2 text-[14px] font-medium text-[#292926] hover:bg-black/[0.035]"
        >
          Magica Auto
          <LineIcon name="chevron-down" className="size-4 text-[#777773]" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {showFolder ? (
          <button
            type="button"
            aria-label="Task assets"
            className="grid size-9 place-items-center rounded-full text-[#74746f] hover:bg-black/[0.04]"
          >
            <LineIcon name="folder" className="size-[18px]" />
          </button>
        ) : null}
        <Link
          href="/usage"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-black/8 bg-[#fafafa] px-3.5 text-[13px] font-medium text-[#555550] shadow-sm hover:bg-white"
        >
          <span aria-hidden="true" className="text-[#6654f4]">
            ✦
          </span>
          {credits}
        </Link>
      </div>
    </header>
  );
}
