"use client";

import { useState } from "react";

export function ChatShell() {
  const [message, setMessage] = useState("");

  return (
    <main className="grid min-h-screen bg-[#f7f7f5] text-[#22221f] md:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-black/8 bg-[#efefec] p-3 md:flex md:flex-col">
        <button
          type="button"
          className="rounded-xl border border-black/10 bg-white px-4 py-3 text-left text-sm font-medium shadow-sm transition hover:bg-black/[0.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          + New chat
        </button>
        <div className="flex flex-1 items-center justify-center text-center text-xs text-black/45">
          Conversations appear here
        </div>
        <div className="rounded-xl px-3 py-2 text-sm text-black/55">
          Account setup pending
        </div>
      </aside>

      <section className="flex min-h-screen min-w-0 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-black/8 px-4 md:px-6">
          <div>
            <p className="text-sm font-medium">Agent Chat</p>
            <p className="text-xs text-black/45">New conversation</p>
          </div>
          <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs text-black/55">
            0 credits used
          </span>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 pb-32">
          <div className="max-w-md text-center">
            <div
              aria-hidden="true"
              className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl bg-[#252520] text-lg text-white shadow-lg"
            >
              ✦
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.02em]">
              What can I help you create?
            </h1>
            <p className="mt-2 text-sm leading-6 text-black/50">
              Ask a question or start a media workflow.
            </p>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-[#f7f7f5] via-[#f7f7f5] to-transparent px-3 pt-8 pb-4 md:left-[260px] md:px-6 md:pb-6">
          <form
            className="mx-auto flex max-w-3xl items-end gap-3 rounded-2xl border border-black/10 bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.08)] focus-within:border-black/25"
            onSubmit={(event) => event.preventDefault()}
          >
            <button
              type="button"
              aria-label="Attach image"
              className="grid size-10 shrink-0 place-items-center rounded-xl text-lg text-black/55 hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
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
              rows={1}
              placeholder="Message Agent Chat"
              className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-[15px] outline-none placeholder:text-black/35"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!message.trim()}
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#252520] text-white transition hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-30"
            >
              ↑
            </button>
          </form>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-black/35">
            Agent responses can be inaccurate. Verify important results.
          </p>
        </div>
      </section>
    </main>
  );
}
