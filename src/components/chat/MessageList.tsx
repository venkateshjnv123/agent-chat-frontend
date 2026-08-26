"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import type { Message } from "@/contracts/generated";
import type { AssistantStreamBuffer } from "@/stores/assistantStream";

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
  streamBuffer?: AssistantStreamBuffer;
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
  streamBuffer,
  realtimeDegraded,
}: MessageListProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const newestMessage = messages[0];
  const newestMessageSignature = newestMessage
    ? `${newestMessage.id}:${newestMessage.status}:${newestMessage.content.length}:${streamBuffer?.textSequence ?? 0}`
    : "empty";
  const chronologicalMessages = [...messages].reverse();

  useEffect(() => {
    const viewport = viewportRef.current;

    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [newestMessageSignature]);

  return (
    <div
      ref={viewportRef}
      className="min-h-0 max-w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-5 md:px-6 md:py-7"
      role="log"
      aria-live="polite"
    >
      <div className="mx-auto flex min-h-full w-full max-w-[900px] min-w-0 flex-col justify-end gap-5 overflow-x-clip">
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
          <MessageBubble
            key={message.id}
            message={message}
            streamBuffer={streamBuffer}
          />
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

function MessageBubble({
  message,
  streamBuffer,
}: {
  message: Message;
  streamBuffer?: AssistantStreamBuffer;
}) {
  const isUser = message.role === "USER";
  const waiting = isMessagePending(message);
  const failed = message.status === "FAILED";
  const cancelled = message.status === "CANCELLED";
  const matchingStream =
    waiting &&
    message.runId === streamBuffer?.runId &&
    message.id === streamBuffer.messageId
      ? streamBuffer
      : undefined;
  const assistantContent =
    matchingStream && matchingStream.text.length >= message.content.length
      ? matchingStream.text
      : message.content;
  const presentation = prepareMessageContent(
    message,
    isUser ? message.content : assistantContent,
  );
  const renderedContent = presentation.text;
  const showContent = Boolean(renderedContent);

  return (
    <article
      className={`flex max-w-full min-w-0 ${isUser ? "justify-end" : "justify-start"}`}
      data-sequence={message.sequence}
    >
      <div
        className={`max-w-full min-w-0 text-left ${
          isUser ? "w-auto max-w-[88%] md:max-w-[75%]" : "w-full"
        }`}
      >
        <div className="grid max-w-full min-w-0 gap-2">
          {isUser && message.attachments.length > 0 ? (
            <div className="ml-auto grid w-fit max-w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
              {message.attachments.map((attachment) =>
                attachment.url ? (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="max-w-full min-w-0 overflow-hidden rounded-[16px] border border-black/10 bg-white shadow-sm sm:first:col-span-2"
                  >
                    <AttachmentPreview attachment={attachment} />
                  </a>
                ) : null,
              )}
            </div>
          ) : null}
          {presentation.media.length > 0 ? (
            <InlineMedia items={presentation.media} />
          ) : null}
          {!isUser ? (
            <StepGroup message={message} streamBuffer={matchingStream} />
          ) : null}
          {!isUser && message.runId ? (
            <MessageWaitpoint message={message} />
          ) : null}
          {showContent ? (
            <div
              className={`max-w-full min-w-0 overflow-hidden px-4 py-3 text-left text-[14px] leading-6 [overflow-wrap:anywhere] break-words whitespace-pre-wrap ${
                isUser
                  ? "rounded-[24px] bg-[#ececea] text-[#22221f]"
                  : failed
                    ? "rounded-2xl border border-red-200 bg-red-50 text-red-900"
                    : cancelled
                      ? "rounded-2xl border border-black/10 bg-white text-black/50"
                      : "rounded-2xl border border-black/10 bg-white text-[#22221f] shadow-[0_1px_3px_rgba(0,0,0,.05)]"
              }`}
            >
              {renderedContent}
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

type InlineMediaItem = {
  url: string;
  alt: string;
  type: "image" | "video" | "audio";
};

function AttachmentPreview({
  attachment,
}: {
  attachment: Message["attachments"][number];
}) {
  if (attachment.mimeType?.startsWith("video/")) {
    return (
      <video
        muted
        playsInline
        preload="metadata"
        src={attachment.url ?? undefined}
        className="block h-auto max-h-[420px] w-full object-contain"
      />
    );
  }

  if (attachment.mimeType?.startsWith("audio/")) {
    return (
      <span className="flex min-h-20 items-center px-4 py-3 text-sm text-[#585858]">
        {attachment.filename ?? "Attached audio"}
      </span>
    );
  }

  return (
    <Image
      unoptimized
      src={attachment.url ?? ""}
      alt={attachment.filename ?? "Attached image"}
      width={attachment.width ?? 768}
      height={attachment.height ?? 768}
      className="h-auto max-h-[420px] w-full object-contain"
    />
  );
}

function InlineMedia({ items }: { items: InlineMediaItem[] }) {
  return (
    <div className="grid max-w-[520px] min-w-0 gap-2">
      {items.map((item) =>
        item.type === "image" ? (
          <a
            key={item.url}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="block max-w-full min-w-0 overflow-hidden rounded-[16px] border border-black/10 bg-white"
          >
            <Image
              unoptimized
              src={item.url}
              alt={item.alt}
              width={768}
              height={768}
              className="h-auto max-h-[520px] w-full object-contain"
            />
          </a>
        ) : item.type === "video" ? (
          <video
            key={item.url}
            controls
            playsInline
            preload="metadata"
            src={item.url}
            className="block h-auto max-h-[520px] w-full rounded-[16px] bg-black"
          />
        ) : (
          <audio
            key={item.url}
            controls
            preload="metadata"
            src={item.url}
            className="w-full max-w-full"
          />
        ),
      )}
    </div>
  );
}

function prepareMessageContent(message: Message, content: string) {
  const renderedUrls = new Set([
    ...message.attachments.flatMap((attachment) =>
      attachment.url ? [attachment.url] : [],
    ),
    ...message.toolInvocations.flatMap((invocation) => {
      const result = invocation.result;

      return result &&
        (result.type === "image" ||
          result.type === "video" ||
          result.type === "audio")
        ? result.urls
        : [];
    }),
  ]);
  const media = new Map<string, InlineMediaItem>();

  let text = content.replace(
    /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g,
    (_markdown, alt: string, url: string) => {
      if (!renderedUrls.has(url)) {
        media.set(url, { url, alt: alt || "Generated image", type: "image" });
      }

      return "";
    },
  );

  if (message.attachments.length > 0) {
    text = text.replace(/\n+\s*Attached (?:images?|files?)\s*:[\s\S]*$/i, "");
  }

  text = text.replace(/https?:\/\/[^\s<>()]+/g, (rawUrl) => {
    const url = rawUrl.replace(/[.,!?;:]+$/, "");
    const trailing = rawUrl.slice(url.length);

    if (renderedUrls.has(url)) return trailing;

    const type = mediaTypeFromUrl(url);
    if (!type) return rawUrl;

    media.set(url, { url, alt: "Generated media", type });
    return trailing;
  });

  return {
    media: [...media.values()],
    text: text.replace(/\n{3,}/g, "\n\n").trim(),
  };
}

function mediaTypeFromUrl(url: string): InlineMediaItem["type"] | null {
  let pathname: string;

  try {
    pathname = new URL(url).pathname.toLowerCase();
  } catch {
    return null;
  }

  if (/\.(?:avif|gif|jpe?g|png|webp)$/.test(pathname)) return "image";
  if (/\.(?:m4v|mov|mp4|webm)$/.test(pathname)) return "video";
  if (/\.(?:aac|m4a|mp3|ogg|wav)$/.test(pathname)) return "audio";

  return null;
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
