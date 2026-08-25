"use client";

import Link from "next/link";
import { useState } from "react";

import { Sidebar } from "@/components/chat/Sidebar";
import type { LedgerEntry } from "@/contracts/generated";
import { formatCreditBalance, formatCreditDelta } from "@/lib/credits/format";
import { useCreditLedger, useCredits } from "@/queries/useCredits";

type View = "overview" | "detailed";

export function CreditsView() {
  const [view, setView] = useState<View>("overview");
  const credits = useCredits();
  const ledger = useCreditLedger();

  if (credits.isPending || ledger.isPending) return <CreditsSkeleton />;

  if (credits.error || ledger.error) {
    return (
      <CreditsFrame>
        <div className="mx-auto mt-20 max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-xl font-semibold text-red-900">
            Credits could not load
          </h1>
          <p className="mt-2 text-sm leading-6 text-red-700">
            Balance and ledger stay server-owned. Retry to read saved state.
          </p>
          <button
            type="button"
            onClick={() =>
              void Promise.all([credits.refetch(), ledger.refetch()])
            }
            className="mt-5 rounded-xl bg-red-700 px-4 py-2 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800"
          >
            Try again
          </button>
        </div>
      </CreditsFrame>
    );
  }

  const balance = credits.data;
  const visibleEntries =
    view === "overview" ? ledger.entries.slice(0, 5) : ledger.entries;

  return (
    <CreditsFrame>
      <header className="mb-8">
        <p className="text-xs font-semibold tracking-[0.14em] text-black/40 uppercase">
          Account usage
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          AI Credits
        </h1>
        <p className="mt-2 text-sm text-black/50">
          Server balance and append-only reserve, settle, refund history.
        </p>
      </header>

      <section
        aria-label="Credit balance"
        className="grid gap-3 sm:grid-cols-2"
      >
        <CreditStat
          label="Available balance"
          value={formatCreditBalance(balance.availableBalance)}
          detail="Spendable now"
        />
        <CreditStat
          label="Reserved balance"
          value={formatCreditBalance(balance.reservedBalance)}
          detail="Held by active paid steps"
        />
      </section>

      <div
        role="tablist"
        aria-label="Credit views"
        className="mt-6 grid grid-cols-2 rounded-2xl bg-black/[0.035] p-1"
      >
        {(["overview", "detailed"] as const).map((candidate) => (
          <button
            key={candidate}
            type="button"
            role="tab"
            aria-selected={view === candidate}
            onClick={() => setView(candidate)}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              view === candidate
                ? "bg-white text-black shadow-sm"
                : "text-black/45 hover:text-black/70"
            }`}
          >
            {candidate === "overview" ? "Overview" : "Detailed View"}
          </button>
        ))}
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-black/8 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">
              {view === "overview" ? "Recent activity" : "Credit ledger"}
            </h2>
            <p className="mt-1 text-xs text-black/45">
              {view === "overview"
                ? "Newest five loaded entries. No partial-page totals."
                : "Newest first. Load older entries using server cursor pagination."}
            </p>
          </div>
          {view === "overview" && ledger.entries.length > 5 ? (
            <button
              type="button"
              onClick={() => setView("detailed")}
              className="shrink-0 text-xs font-medium text-blue-700 hover:underline"
            >
              View all loaded
            </button>
          ) : null}
        </div>

        {visibleEntries.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div
              aria-hidden="true"
              className="mx-auto grid size-10 place-items-center rounded-xl bg-black/5 text-black/40"
            >
              ◇
            </div>
            <h2 className="mt-4 text-sm font-semibold">
              No credit activity yet
            </h2>
            <p className="mt-1 text-xs text-black/45">
              Paid tool runs and zero-rated model usage will appear here.
            </p>
          </div>
        ) : (
          <ul
            className="divide-y divide-black/8"
            aria-label="Credit ledger entries"
          >
            {visibleEntries.map((entry) => (
              <LedgerRow key={entry.id} entry={entry} />
            ))}
          </ul>
        )}

        {view === "detailed" && ledger.hasNextPage ? (
          <div className="border-t border-black/8 p-4 text-center">
            <button
              type="button"
              disabled={ledger.isFetchingNextPage}
              onClick={() => void ledger.fetchNextPage()}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black/60 hover:bg-black/[0.03] disabled:cursor-wait disabled:opacity-50"
            >
              {ledger.isFetchingNextPage ? "Loading…" : "Load older entries"}
            </button>
          </div>
        ) : null}
      </section>
    </CreditsFrame>
  );
}

function CreditsFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden border-t-2 border-[#2e3cff] bg-[#f7f7f5] text-[#22221f]">
      <Sidebar activeItem="usage" />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/chat"
            className="mb-7 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-black/50 hover:bg-black/5 hover:text-black"
          >
            <span aria-hidden="true">←</span> Back to chat
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}

function CreditsSkeleton() {
  return (
    <CreditsFrame>
      <div role="status" aria-label="Loading credits" className="animate-pulse">
        <div className="h-4 w-28 rounded bg-black/8" />
        <div className="mt-4 h-10 w-64 max-w-full rounded bg-black/8" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-black/6" />
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <div className="h-32 rounded-2xl bg-white ring-1 ring-black/5" />
          <div className="h-32 rounded-2xl bg-white ring-1 ring-black/5" />
        </div>
        <div className="mt-6 h-64 rounded-2xl bg-white ring-1 ring-black/5" />
        <span className="sr-only">Loading credits…</span>
      </div>
    </CreditsFrame>
  );
}

function CreditStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold tracking-wide text-black/40 uppercase">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] tabular-nums">
        {value}
      </p>
      <p className="mt-2 text-xs text-black/45">{detail}</p>
    </div>
  );
}

function LedgerRow({ entry }: { entry: LedgerEntry }) {
  const label = entry.toolName
    ? formatToolName(entry.toolName)
    : entry.zeroRated
      ? "OpenRouter model"
      : "Account adjustment";

  return (
    <li className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-1 text-[11px] font-medium ${kindTone(entry.kind)}`}
          >
            {formatKind(entry.kind)}
          </span>
          {entry.zeroRated ? (
            <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
              Zero-rated
            </span>
          ) : null}
          <p className="truncate text-sm font-medium text-black/75">{label}</p>
        </div>
        {entry.note ? (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-black/45">
            {entry.note}
          </p>
        ) : null}
        <p className="mt-2 text-[11px] text-black/35">
          {formatTimestamp(entry.createdAt)}
        </p>
      </div>
      <p
        className={`text-sm font-semibold tabular-nums ${deltaTone(entry.delta)}`}
      >
        {formatCreditDelta(entry.delta)}
      </p>
    </li>
  );
}

function formatToolName(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatKind(kind: LedgerEntry["kind"]) {
  return kind.charAt(0) + kind.slice(1).toLowerCase();
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function kindTone(kind: LedgerEntry["kind"]) {
  const tones: Record<LedgerEntry["kind"], string> = {
    RESERVE: "bg-amber-50 text-amber-700",
    SETTLE: "bg-blue-50 text-blue-700",
    REFUND: "bg-emerald-50 text-emerald-700",
  };

  return tones[kind];
}

function deltaTone(delta: number) {
  if (delta < 0) return "text-red-700";
  if (delta > 0) return "text-emerald-700";
  return "text-black/45";
}
