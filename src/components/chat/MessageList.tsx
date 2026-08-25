"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import type { Message } from "@/contracts/generated";

import { MessageWaitpoint } from "@/components/approval/MessageWaitpoint";

import { RetryTurn } from "./RetryTurn";
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
      className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8"
      role="log"
      aria-live="polite"
    >
      <div className="mx-auto flex min-h-full w-full max-w-[1040px] flex-col justify-end gap-5">
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
      <div
        className={`w-full text-left ${
          isUser ? "max-w-[88%] md:max-w-[78%]" : "max-w-[94%] md:max-w-[88%]"
        }`}
      >
        <div className="grid gap-2">
          {isUser && message.attachments.length > 0 ? (
            <div className="ml-auto grid max-w-[520px] grid-cols-2 gap-2">
              {message.attachments.map((attachment) =>
                attachment.url ? (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="overflow-hidden rounded-[20px] border border-black/10 bg-white shadow-sm first:col-span-2"
                  >
                    <Image
                      unoptimized
                      src={attachment.url}
                      alt={attachment.filename ?? "Attached image"}
                      width={attachment.width ?? 768}
                      height={attachment.height ?? 768}
                      className="h-auto max-h-[420px] w-full object-contain"
                    />
                  </a>
                ) : null,
              )}
            </div>
          ) : null}
          {!isUser ? <StepGroup message={message} /> : null}
          {!isUser && message.runId ? (
            <MessageWaitpoint message={message} />
          ) : null}
          {showContent ? (
            <div
              className={`px-5 py-3.5 text-left text-[15px] leading-6 whitespace-pre-wrap ${
                isUser
                  ? "rounded-[24px] bg-[#ececea] text-[#22221f]"
                  : failed
                    ? "rounded-2xl border border-red-200 bg-red-50 text-red-900"
                    : cancelled
                      ? "rounded-2xl border border-black/10 bg-white text-black/50"
                      : "rounded-2xl border border-black/10 bg-white text-[#22221f] shadow-[0_1px_3px_rgba(0,0,0,.05)]"
              }`}
            >
              {content}
            </div>
          ) : null}
        </div>
        {!isUser && failed ? <RetryTurn message={message} /> : null}
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
