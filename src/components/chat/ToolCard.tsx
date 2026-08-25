import Image from "next/image";
import type { ReactNode } from "react";

import type {
  RendererKey,
  ToolInvocation,
  ToolResult,
} from "@/contracts/generated";
import { formatCredits } from "@/lib/credits/format";

type RenderedResult = {
  summary: ReactNode;
  media?: ReactNode;
};

type ResultRenderer = (
  result: ToolResult,
  invocation: ToolInvocation,
) => RenderedResult;

const RESULT_RENDERERS = {
  image: renderImageResult,
  video: renderVideoResult,
  audio: renderAudioResult,
  text: renderTextResult,
  schema: renderDataResult,
  skill: renderDataResult,
  plan: renderDataResult,
  generic: renderGenericResult,
} satisfies Record<RendererKey, ResultRenderer>;

const STATE_STYLES: Record<ToolInvocation["state"], string> = {
  PENDING: "bg-black/5 text-black/45",
  RUNNING: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
  CANCELLED: "bg-black/5 text-black/45",
};

export function ToolCard({ invocation }: { invocation: ToolInvocation }) {
  const duration = formatDuration(invocation.startedAt, invocation.completedAt);
  const renderedResult = invocation.result
    ? RESULT_RENDERERS[invocation.rendererKey](invocation.result, invocation)
    : null;
  const inputEntries = Object.entries(invocation.sanitizedInput);

  return (
    <section
      className="text-left"
      aria-label={`${formatToolName(invocation.toolName)} tool step`}
    >
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
        <div className="flex min-w-0 items-center gap-2 px-3.5 py-3">
          <RendererGlyph rendererKey={invocation.rendererKey} />
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-[#292925]">
            {formatToolName(invocation.toolName)}
          </p>
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${STATE_STYLES[invocation.state]}`}
          >
            <StateGlyph state={invocation.state} />
            {formatState(invocation.state)}
          </span>
          {duration ? (
            <span className="shrink-0 text-[11px] text-black/40 tabular-nums">
              {duration}
            </span>
          ) : null}
        </div>

        {inputEntries.length > 0 ? (
          <details className="border-t border-black/8 px-3.5 py-2.5">
            <summary className="cursor-pointer text-xs font-medium text-black/50 select-none">
              Research details
            </summary>
            <DataList entries={inputEntries} className="mt-3" />
          </details>
        ) : null}

        {renderedResult ? (
          <div className="border-t border-black/8 px-3.5 py-3 text-sm text-black/65">
            {renderedResult.summary}
          </div>
        ) : null}

        {invocation.userMessage ? (
          <p className="border-t border-red-100 bg-red-50/70 px-3.5 py-2.5 text-xs leading-5 text-red-700">
            {invocation.userMessage}
          </p>
        ) : null}

        {invocation.creditUsed > 0 ? (
          <div className="border-t border-black/8 px-3.5 py-2">
            <span className="inline-flex rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
              {formatCredits(invocation.creditUsed, { precision: 4 })} credits
            </span>
          </div>
        ) : null}
      </div>

      {renderedResult?.media ? (
        <div className="mt-3">{renderedResult.media}</div>
      ) : null}
    </section>
  );
}

function RendererGlyph({ rendererKey }: { rendererKey: RendererKey }) {
  const glyph: Record<RendererKey, string> = {
    image: "✦",
    video: "▶",
    audio: "♪",
    text: "T",
    schema: "◇",
    skill: "ϟ",
    plan: "☷",
    generic: "◆",
  };

  return (
    <span
      aria-hidden="true"
      className="grid size-7 shrink-0 place-items-center rounded-lg bg-black/5 text-xs font-semibold text-black/55"
    >
      {glyph[rendererKey]}
    </span>
  );
}

function StateGlyph({ state }: { state: ToolInvocation["state"] }) {
  if (state === "RUNNING") {
    return (
      <span
        aria-hidden="true"
        className="size-2.5 animate-spin rounded-full border border-current border-r-transparent"
      />
    );
  }

  const glyph: Record<Exclude<ToolInvocation["state"], "RUNNING">, string> = {
    PENDING: "○",
    COMPLETED: "✓",
    FAILED: "⊗",
    CANCELLED: "×",
  };

  return <span aria-hidden="true">{glyph[state]}</span>;
}

function renderImageResult(
  result: ToolResult,
  invocation: ToolInvocation,
): RenderedResult {
  if (result.type !== "image") return renderGenericResult(result, invocation);

  return {
    summary:
      result.urls.length === 1
        ? "1 image ready"
        : `${result.urls.length} images ready`,
    media: (
      <div className="grid max-w-[420px] gap-3">
        {result.urls.map((url, index) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:shadow-md"
            aria-label={`Open ${formatToolName(invocation.toolName)} image ${index + 1}`}
          >
            <Image
              unoptimized
              src={url}
              alt={`${formatToolName(invocation.toolName)} result ${index + 1}`}
              width={result.width ?? 768}
              height={result.height ?? 768}
              className="h-auto w-full object-contain"
            />
          </a>
        ))}
      </div>
    ),
  };
}

function renderVideoResult(
  result: ToolResult,
  invocation: ToolInvocation,
): RenderedResult {
  if (result.type !== "video") return renderGenericResult(result, invocation);

  return {
    summary:
      result.urls.length === 1
        ? "1 video ready"
        : `${result.urls.length} videos ready`,
    media: (
      <div className="grid max-w-xl gap-3">
        {result.urls.map((url, index) => (
          <div
            key={url}
            className="overflow-hidden rounded-2xl border border-black/10 bg-black shadow-sm"
          >
            <video
              controls
              preload="metadata"
              src={url}
              className="block h-auto w-full"
              aria-label={`${formatToolName(invocation.toolName)} video ${index + 1}`}
            />
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="block bg-white px-3 py-2 text-xs font-medium text-blue-700 hover:underline"
            >
              Open video in new tab
            </a>
          </div>
        ))}
      </div>
    ),
  };
}

function renderAudioResult(
  result: ToolResult,
  invocation: ToolInvocation,
): RenderedResult {
  if (result.type !== "audio") return renderGenericResult(result, invocation);

  return {
    summary:
      result.urls.length === 1
        ? "1 audio result ready"
        : `${result.urls.length} audio results ready`,
    media: (
      <div className="grid max-w-xl gap-3">
        {result.urls.map((url, index) => (
          <audio
            key={url}
            controls
            preload="metadata"
            src={url}
            className="w-full"
            aria-label={`${formatToolName(invocation.toolName)} audio ${index + 1}`}
          />
        ))}
      </div>
    ),
  };
}

function renderTextResult(
  result: ToolResult,
  invocation: ToolInvocation,
): RenderedResult {
  if (result.type !== "text") return renderGenericResult(result, invocation);

  return {
    summary: <p className="leading-6 whitespace-pre-wrap">{result.text}</p>,
  };
}

function renderDataResult(
  result: ToolResult,
  invocation: ToolInvocation,
): RenderedResult {
  if (result.type !== "data") return renderGenericResult(result, invocation);

  const entries = Object.entries(result.data);

  return {
    summary:
      entries.length === 0 ? (
        "Structured result ready"
      ) : (
        <DataList entries={entries} />
      ),
  };
}

function renderGenericResult(
  result: ToolResult,
  invocation: ToolInvocation,
): RenderedResult {
  switch (result.type) {
    case "image":
      return renderImageResult(result, invocation);
    case "video":
      return renderVideoResult(result, invocation);
    case "audio":
      return renderAudioResult(result, invocation);
    case "text":
      return renderTextResult(result, invocation);
    case "data":
      return renderDataResult(result, invocation);
  }
}

function DataList({
  entries,
  className = "",
}: {
  entries: [string, unknown][];
  className?: string;
}) {
  return (
    <dl className={`grid gap-2 ${className}`}>
      {entries.map(([key, value]) => (
        <div key={key} className="grid grid-cols-[minmax(0,120px)_1fr] gap-3">
          <dt className="truncate text-xs font-medium text-black/45">
            {formatFieldName(key)}
          </dt>
          <dd className="min-w-0 text-xs break-words text-black/70">
            {formatDataValue(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function formatToolName(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatFieldName(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (character) => character.toUpperCase());
}

function formatDataValue(value: unknown) {
  if (value === null) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

function formatState(state: ToolInvocation["state"]) {
  return state.charAt(0) + state.slice(1).toLowerCase();
}

function formatDuration(startedAt: string | null, completedAt: string | null) {
  if (!startedAt || !completedAt) return null;

  const milliseconds = Math.max(
    0,
    new Date(completedAt).getTime() - new Date(startedAt).getTime(),
  );

  if (milliseconds < 1_000) return `${milliseconds}ms`;

  const seconds = milliseconds / 1_000;
  return `${seconds < 10 ? seconds.toFixed(1) : Math.round(seconds)}s`;
}
