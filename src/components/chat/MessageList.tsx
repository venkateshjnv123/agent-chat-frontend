"use client";

import { useEffect, useRef } from "react";

import type { Message } from "@/contracts/generated";

import { StepGroup } from "./StepGroup";

type MessageListProps = {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  hasOlder: boolean;
  isLoadingOlder: boolean;
  onLoadOlder: () => void;
  runMessage?: string | null;
  realtimeDegraded: boolean;
};

export function MessageList({
  messages,
  isLoading,
  error,
  hasOlder,
  isLoadingOlder,
  onLoadOlder,
  runMessage,
  realtimeDegraded,
}: MessageListProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const newestMessage = messages[0];
  const newestMessageSignature = newestMessage
    ? `${newestMessage.id}:${newestMessage.status}:${newestMessage.content.length}`
    : "empty";
  const chronologicalMessages = [...messages].reverse();

  useEffect(() => {
    const viewport = viewportRef.current;

    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [newestMessageSignature]);

  return (
    <div
      ref={viewportRef}
      className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8"
      role="log"
      aria-live="polite"
    >
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-end gap-4">
        {realtimeDegraded ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Live updates reconnecting. Saved state will refresh automatically.
          </p>
        ) : null}
        {runMessage ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {runMessage}
          </p>
        ) : null}
        {isLoading ? (
          <p className="py-12 text-center text-sm text-black/45">
            Loading messages…
          </p>
        ) : null}
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Could not load messages. Refresh to reconcile saved state.
          </p>
        ) : null}
        {!isLoading && !error && messages.length === 0 ? <EmptyChat /> : null}
        {hasOlder ? (
          <button
            type="button"
            onClick={onLoadOlder}
            disabled={isLoadingOlder}
            className="self-center rounded-lg px-3 py-2 text-xs font-medium text-black/50 hover:bg-black/5 hover:text-black disabled:opacity-50"
          >
            {isLoadingOlder ? "Loading…" : "Load older messages"}
          </button>
        ) : null}
        {chronologicalMessages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>
    </div>
  );
}

function EmptyChat() {
  return (
    <div className="grid min-h-[55vh] place-items-center py-10 text-center">
      <div className="max-w-md">
        <div
          aria-hidden="true"
          className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl bg-[#252520] text-lg text-white shadow-lg"
        >
          ✦
        </div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">
          Your AI worker
        </h1>
        <p className="mt-2 text-sm leading-6 text-black/50">
          Work at the speed of thought.
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "USER";
  const waiting = isMessagePending(message);
  const failed = message.status === "FAILED";
  const cancelled = message.status === "CANCELLED";
  const hasToolInvocations = message.toolInvocations.length > 0;
  const renderedContent = isUser
    ? message.content
    : stripRenderedMediaMarkdown(message);
  const showContent =
    Boolean(renderedContent) || (!waiting && !hasToolInvocations);
  const content = renderedContent || (waiting ? "" : "No response content");

  return (
    <article
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      data-sequence={message.sequence}
    >
      <div className="w-full max-w-[85%] text-left md:max-w-[75%]">
        <div className="grid gap-2">
          {!isUser ? <StepGroup message={message} /> : null}
          {showContent ? (
            <div
              className={`rounded-2xl px-4 py-3 text-left text-sm leading-6 whitespace-pre-wrap ${
                isUser
                  ? "bg-[#e9e9e5] text-[#22221f]"
                  : failed
                    ? "border border-red-200 bg-red-50 text-red-900"
                    : cancelled
                      ? "border border-black/10 bg-white text-black/50"
                      : "bg-white text-[#22221f] shadow-sm ring-1 ring-black/5"
              }`}
            >
              {content}
            </div>
          ) : null}
        </div>
        <p
          className={`mt-1 px-1 text-[11px] text-black/35 ${isUser ? "text-right" : "text-left"}`}
        >
          {formatTime(message.createdAt)}
          {waiting ? " · Working" : null}
          {failed ? " · Failed" : null}
          {cancelled ? " · Cancelled" : null}
        </p>
      </div>
    </article>
  );
}

function stripRenderedMediaMarkdown(message: Message) {
  const renderedUrls = new Set(
    message.toolInvocations.flatMap((invocation) => {
      const result = invocation.result;

      return result &&
        (result.type === "image" ||
          result.type === "video" ||
          result.type === "audio")
        ? result.urls
        : [];
    }),
  );

  if (renderedUrls.size === 0) return message.content;

  return message.content
    .replace(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g, (markdown, url: string) =>
      renderedUrls.has(url) ? "" : markdown,
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isMessagePending(message: Message) {
  return message.status === "PENDING" || message.status === "STREAMING";
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
