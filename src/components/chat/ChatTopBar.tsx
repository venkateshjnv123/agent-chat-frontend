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
    <header className="flex h-[60px] shrink-0 items-center px-4 md:px-6">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Open sidebar"
          onClick={onOpenSidebar}
          className="grid size-8 place-items-center rounded-[10px] text-[#585858] hover:bg-[#f7f7f7] md:hidden"
        >
          <LineIcon name="panel" className="size-[19px]" />
        </button>
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1.5 rounded-[10px] bg-[#f7f7f7] px-2 text-[14px] font-normal text-[#1b1b1b] hover:bg-[#f1f1f1]"
        >
          Magica Auto
          <LineIcon name="chevron-down" className="size-4 text-[#777773]" />
        </button>
      </div>

      <div
        className={`flex items-center gap-2 ${showFolder ? "ml-auto" : "ml-auto md:ml-2"}`}
      >
        {showFolder ? (
          <button
            type="button"
            aria-label="Task assets"
            className="grid size-8 place-items-center rounded-full text-[#585858] hover:bg-[#f7f7f7]"
          >
            <LineIcon name="folder" className="size-[18px]" />
          </button>
        ) : null}
        <Link
          href="/usage"
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#fafafa] px-3 text-[14px] font-normal text-[#1b1b1b] hover:bg-[#f1f1f1]"
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
