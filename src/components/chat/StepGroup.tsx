"use client";

import { useState } from "react";

import type { Message } from "@/contracts/generated";

import { ToolCard } from "./ToolCard";

export function StepGroup({ message }: { message: Message }) {
  const [open, setOpen] = useState(true);
  const waiting =
    message.status === "PENDING" || message.status === "STREAMING";
  const thinkingBlocks =
    message.contentBlocks?.filter((block) => block.type === "thinking") ?? [];
  const syntheticResearch =
    waiting &&
    thinkingBlocks.length === 0 &&
    message.toolInvocations.length === 0;
  const stepCount =
    thinkingBlocks.length +
    message.toolInvocations.length +
    (syntheticResearch ? 1 : 0);

  if (stepCount === 0) return null;

  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="group rounded-2xl border border-black/10 bg-white/70 shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3.5 py-3 text-sm font-medium text-black/55 select-none [&::-webkit-details-marker]:hidden">
        {waiting ? (
          <span
            aria-hidden="true"
            className="size-3 animate-spin rounded-full border-2 border-blue-600 border-r-transparent"
          />
        ) : (
          <span aria-hidden="true" className="text-emerald-600">
            ✓
          </span>
        )}
        <span className="flex-1">
          Working · {stepCount} {stepCount === 1 ? "step" : "steps"}
        </span>
        <span
          aria-hidden="true"
          className="text-xs transition group-open:rotate-180"
        >
          ⌄
        </span>
      </summary>

      <div className="grid gap-2 border-t border-black/8 p-2.5">
        {syntheticResearch ? <ResearchStep active /> : null}
        {thinkingBlocks.map((block, index) => (
          <ResearchStep
            key={`${message.id}:thinking:${index}`}
            active={waiting}
            detail={block.thinking}
            durationSeconds={message.metadata?.thinkingDurationSeconds}
          />
        ))}
        {message.toolInvocations.map((invocation) => (
          <ToolCard key={invocation.id} invocation={invocation} />
        ))}
      </div>
    </details>
  );
}

function ResearchStep({
  active,
  detail,
  durationSeconds,
}: {
  active: boolean;
  detail?: string;
  durationSeconds?: number | null;
}) {
  return (
    <section
      aria-label="Research step"
      className="rounded-xl border border-black/8 bg-white px-3.5 py-3"
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="grid size-7 place-items-center rounded-lg bg-violet-50 text-sm text-violet-700"
        >
          ◌
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-black/75">
            {active ? "Researching request" : "Research complete"}
          </p>
          {!detail && active ? (
            <p className="mt-0.5 text-xs text-black/45">
              Understanding intent and selecting best tools…
            </p>
          ) : null}
        </div>
        {active ? (
          <span
            aria-label="Research running"
            className="size-3 animate-spin rounded-full border-2 border-blue-600 border-r-transparent"
          />
        ) : (
          <span aria-label="Research completed" className="text-emerald-600">
            ✓
          </span>
        )}
        {durationSeconds !== null && durationSeconds !== undefined ? (
          <span className="text-[11px] text-black/40 tabular-nums">
            {formatDuration(durationSeconds)}
          </span>
        ) : null}
      </div>
      {detail ? (
        <p className="mt-3 border-t border-black/8 pt-3 text-xs leading-5 whitespace-pre-wrap text-black/60 italic">
          {detail}
        </p>
      ) : null}
    </section>
  );
}

function formatDuration(seconds: number) {
  return seconds < 1
    ? `${Math.round(seconds * 1_000)}ms`
    : `${seconds.toFixed(1)}s`;
}
