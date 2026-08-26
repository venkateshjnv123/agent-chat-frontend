"use client";

import { useState } from "react";

import type { Message, ToolInvocation } from "@/contracts/generated";
import type { AssistantStreamBuffer } from "@/stores/assistantStream";

import { ToolCard } from "./ToolCard";

export function StepGroup({
  message,
  streamBuffer,
}: {
  message: Message;
  streamBuffer?: AssistantStreamBuffer;
}) {
  const [open, setOpen] = useState(true);
  const waiting =
    message.status === "PENDING" || message.status === "STREAMING";
  const failed = message.status === "FAILED";
  const cancelled = message.status === "CANCELLED";
  const stateLabel = waiting
    ? "Working"
    : failed
      ? "Failed"
      : cancelled
        ? "Cancelled"
        : "Completed";
  const thinkingBlocks =
    message.contentBlocks?.filter((block) => block.type === "thinking") ?? [];
  const streamedThinking =
    streamBuffer?.activity
      .filter((event) => event.type === "thinking")
      .map((event) => event.text)
      .join("") ?? "";
  const durableThinking = thinkingBlocks
    .map((block) => block.thinking)
    .join("");
  const showStreamedThinking =
    streamedThinking.length > 0 &&
    streamedThinking.length >= durableThinking.length;
  const progressEvent = streamBuffer?.activity.findLast(
    (event) => event.type === "progress",
  );
  const currentStep =
    progressEvent?.currentStep ?? streamBuffer?.metadata?.currentStep;
  const progress = progressEvent?.progress ?? streamBuffer?.metadata?.progress;
  const showProgress =
    waiting && (Boolean(currentStep) || progress !== undefined);
  const persistedToolIds = new Set(
    message.toolInvocations.map((invocation) => invocation.id),
  );
  const liveTools = latestLiveTools(streamBuffer).filter(
    (invocation) => !persistedToolIds.has(invocation.id),
  );
  const thinkingCount = showStreamedThinking ? 1 : thinkingBlocks.length;
  const stepCount =
    thinkingCount +
    message.toolInvocations.length +
    liveTools.length +
    (showProgress ? 1 : 0);

  if (stepCount === 0) return null;

  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="group max-w-full min-w-0 overflow-hidden rounded-xl border border-[#ededed] bg-white"
    >
      <summary className="flex min-w-0 cursor-pointer list-none items-center gap-2 px-4 py-3 text-[14px] leading-5 font-medium text-[#585858] select-none [&::-webkit-details-marker]:hidden">
        {waiting ? (
          <span
            aria-hidden="true"
            className="size-3 animate-spin rounded-full border-2 border-blue-600 border-r-transparent"
          />
        ) : failed ? (
          <span aria-hidden="true" className="text-red-600">
            !
          </span>
        ) : cancelled ? (
          <span aria-hidden="true" className="text-black/40">
            ×
          </span>
        ) : (
          <span aria-hidden="true" className="text-emerald-600">
            ✓
          </span>
        )}
        <span className="flex-1">
          {stateLabel} · {stepCount} {stepCount === 1 ? "step" : "steps"}
        </span>
        <span
          aria-hidden="true"
          className="text-xs transition group-open:rotate-180"
        >
          ⌄
        </span>
      </summary>

      <div className="grid max-w-full min-w-0 gap-2 border-t border-[#ededed] p-2.5">
        {showProgress ? (
          <ProgressStep currentStep={currentStep} progress={progress} />
        ) : null}
        {showStreamedThinking ? (
          <ThinkingStep
            active={waiting}
            detail={streamedThinking}
            durationSeconds={
              streamBuffer?.metadata?.thinkingDurationSeconds ??
              message.metadata?.thinkingDurationSeconds
            }
          />
        ) : (
          thinkingBlocks.map((block, index) => (
            <ThinkingStep
              key={`${message.id}:thinking:${index}`}
              active={waiting}
              detail={block.thinking}
              durationSeconds={message.metadata?.thinkingDurationSeconds}
            />
          ))
        )}
        {message.toolInvocations.map((invocation) => (
          <ToolCard key={invocation.id} invocation={invocation} />
        ))}
        {liveTools.map((invocation) => (
          <ToolCard key={invocation.id} invocation={invocation} />
        ))}
      </div>
    </details>
  );
}

function ProgressStep({
  currentStep,
  progress,
}: {
  currentStep?: string | null;
  progress?: number;
}) {
  const percentage = progress === undefined ? null : Math.round(progress * 100);

  return (
    <section
      aria-label="Run progress"
      className="max-w-full min-w-0 overflow-hidden rounded-[10px] border border-[#ededed] bg-white px-3.5 py-3"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="size-3 animate-spin rounded-full border-2 border-blue-600 border-r-transparent"
        />
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-black/70">
          {currentStep ?? "Working"}
        </p>
        {percentage !== null ? (
          <span className="text-[11px] text-black/40 tabular-nums">
            {percentage}%
          </span>
        ) : null}
      </div>
      {percentage !== null ? (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
          className="mt-2 h-1 overflow-hidden rounded-full bg-black/5"
        >
          <div
            className="h-full rounded-full bg-blue-600 transition-[width]"
            style={{ width: `${percentage}%` }}
          />
        </div>
      ) : null}
    </section>
  );
}

function latestLiveTools(streamBuffer?: AssistantStreamBuffer) {
  const latest = new Map<string, ToolInvocation>();

  for (const event of streamBuffer?.activity ?? []) {
    if (event.type !== "tool") continue;

    latest.set(event.toolCallId, {
      id: event.toolCallId,
      toolName: event.toolName,
      rendererKey:
        event.result?.type === "image" ||
        event.result?.type === "video" ||
        event.result?.type === "audio" ||
        event.result?.type === "text"
          ? event.result.type
          : event.result?.type === "data"
            ? "schema"
            : "generic",
      state: event.state,
      sanitizedInput: {},
      result: event.result,
      resultUrl:
        event.result &&
        (event.result.type === "image" ||
          event.result.type === "video" ||
          event.result.type === "audio")
          ? (event.result.urls[0] ?? null)
          : null,
      userMessage: null,
      creditUsed: 0,
      startedAt: null,
      completedAt: null,
    });
  }

  return [...latest.values()];
}

function ThinkingStep({
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
      aria-label="Thinking step"
      className="max-w-full min-w-0 overflow-hidden rounded-[10px] border border-[#ededed] bg-white px-3.5 py-3"
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
            {active ? "Thinking" : "Thinking complete"}
          </p>
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
        <p className="mt-3 max-w-full overflow-hidden border-t border-[#ededed] pt-3 text-xs leading-5 [overflow-wrap:anywhere] break-words whitespace-pre-wrap text-black/60 italic">
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
