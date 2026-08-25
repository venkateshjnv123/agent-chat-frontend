"use client";

import { useState } from "react";

type ComposerProps = {
  context: "new" | "chat";
  isSending: boolean;
  isRunActive: boolean;
  isStopping: boolean;
  error: Error | null;
  onSend: (content: string) => Promise<void>;
  onStop: () => Promise<void>;
};

const MAX_MESSAGE_LENGTH = 16_000;

export function Composer({
  context,
  isSending,
  isRunActive,
  isStopping,
  error,
  onSend,
  onStop,
}: ComposerProps) {
  const [message, setMessage] = useState("");
  const canSend =
    message.trim().length > 0 &&
    message.length <= MAX_MESSAGE_LENGTH &&
    !isSending &&
    !isRunActive;

  const submit = async () => {
    if (!canSend) return;

    try {
      await onSend(message);
      setMessage("");
    } catch {
      // Mutation state renders the API error and keeps the draft for retry.
    }
  };

  return (
    <div className="shrink-0 bg-gradient-to-t from-[#f7f7f5] via-[#f7f7f5] to-transparent px-3 pt-5 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6 md:pb-6">
      <form
        className="mx-auto flex max-w-3xl items-end gap-3 rounded-2xl border border-black/10 bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.08)] focus-within:border-black/25"
        aria-busy={isSending || isStopping}
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <button
          type="button"
          aria-label="Attach image"
          title="Image uploads arrive in Phase 3"
          disabled
          className="grid size-10 shrink-0 place-items-center rounded-xl text-lg text-black/25"
        >
          +
        </button>
        <label className="sr-only" htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          rows={1}
          maxLength={MAX_MESSAGE_LENGTH + 1}
          disabled={isRunActive}
          placeholder={
            context === "chat"
              ? "Send a message..."
              : "Assign a task or ask anything..."
          }
          className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-[15px] outline-none placeholder:text-black/35 disabled:cursor-not-allowed disabled:opacity-60"
        />
        {isRunActive ? (
          <button
            type="button"
            aria-label={isStopping ? "Stopping run" : "Stop run"}
            disabled={isStopping}
            onClick={() => void onStop().catch(() => undefined)}
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-600 text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-wait disabled:bg-red-300"
          >
            <span
              aria-hidden="true"
              className="size-3 rounded-[2px] bg-white"
            />
          </button>
        ) : (
          <button
            type="submit"
            aria-label="Send message"
            disabled={!canSend}
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#252520] text-white transition hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-30"
          >
            ↑
          </button>
        )}
      </form>
      <div className="mx-auto mt-2 flex max-w-3xl items-start justify-between gap-3 px-1 text-[11px]">
        <p className={error ? "text-red-700" : "text-black/35"}>
          {error
            ? error.message
            : "Agent responses can be inaccurate. Verify important results."}
        </p>
        {message.length > 15_000 ? (
          <span
            className={
              message.length > MAX_MESSAGE_LENGTH
                ? "text-red-700"
                : "text-black/35"
            }
          >
            {message.length.toLocaleString()}/
            {MAX_MESSAGE_LENGTH.toLocaleString()}
          </span>
        ) : null}
      </div>
    </div>
  );
}
