"use client";

import { RouteState } from "@/components/routes/RouteState";

export default function ChatError({ reset }: { reset: () => void }) {
  return (
    <RouteState
      title="Could not load chat"
      description="Connection failed before this chat could be restored."
      action={
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-[#252520] px-4 py-2 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          Try again
        </button>
      }
    />
  );
}
