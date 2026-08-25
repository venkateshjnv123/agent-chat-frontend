import Link from "next/link";

import { RouteState } from "@/components/routes/RouteState";

export default function ChatNotFound() {
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
