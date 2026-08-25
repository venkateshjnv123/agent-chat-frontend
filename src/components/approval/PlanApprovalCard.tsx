"use client";

import { useState } from "react";

import type { ResolveWaitpointRequest, Waitpoint } from "@/contracts/generated";
import { formatCreditEstimate } from "@/lib/credits/format";

type Resolution = Waitpoint["supportedResolutions"][number];

type PlanApprovalCardProps = {
  waitpoint: Waitpoint;
  isSubmitting: boolean;
  error: Error | null;
  onResolve: (request: ResolveWaitpointRequest) => Promise<void>;
};

const ACTION_LABELS: Record<Resolution, string> = {
  RUN_ALL: "Run All",
  STEP_BY_STEP: "Step by Step",
  REQUEST_CHANGES: "Request Changes",
};

export function PlanApprovalCard({
  waitpoint,
  isSubmitting,
  error,
  onResolve,
}: PlanApprovalCardProps) {
  const pending = waitpoint.status === "PENDING";
  const [open, setOpen] = useState(pending);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const canRunAll = waitpoint.supportedResolutions.includes("RUN_ALL");

  const submitResolution = async (
    resolution: Resolution,
    submittedFeedback?: string,
  ) => {
    if (!pending || isSubmitting) return;

    try {
      await onResolve({
        resolution,
        idempotencyKey,
        ...(submittedFeedback ? { feedback: submittedFeedback } : {}),
      });
    } catch {
      // Mutation state renders error. Keep card interactive for same-key retry.
    }
  };

  const submitFeedback = async () => {
    const value = feedback.trim();

    if (!value) {
      setFeedbackError("Say what you want changed.");
      return;
    }

    setFeedbackError(null);
    await submitResolution("REQUEST_CHANGES", value);
  };

  return (
    <section
      aria-label="Plan approval"
      tabIndex={pending ? 0 : -1}
      onKeyDown={(event) => {
        if (
          event.key !== "Enter" ||
          event.target !== event.currentTarget ||
          !pending ||
          !canRunAll
        ) {
          return;
        }

        event.preventDefault();
        void submitResolution("RUN_ALL");
      }}
      className="overflow-hidden rounded-2xl border border-black/12 bg-white text-left shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-black/[0.02]"
      >
        <span
          aria-hidden="true"
          className={`grid size-8 shrink-0 place-items-center rounded-xl text-sm ${statusTone(waitpoint.status)}`}
        >
          {statusGlyph(waitpoint.status)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-black/80">
            {waitpoint.payload.title}
          </span>
          <span className="mt-0.5 block text-xs text-black/45">
            {statusLabel(waitpoint)}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`text-xs text-black/35 transition ${open ? "rotate-180" : ""}`}
        >
          ⌄
        </span>
      </button>

      {open ? (
        <div className="border-t border-black/8">
          <div className="px-4 py-4">
            <p className="text-sm leading-6 text-black/65">
              {waitpoint.payload.overview}
            </p>
          </div>

          <ol className="divide-y divide-black/8 border-y border-black/8">
            {waitpoint.payload.steps.map((step) => (
              <li
                key={`${waitpoint.id}:step:${step.n}`}
                className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 px-4 py-4 sm:grid-cols-[2rem_minmax(0,1fr)_auto]"
              >
                <span className="pt-0.5 text-xs font-medium text-black/45 tabular-nums">
                  {step.n}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-black/80">
                    {step.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-black/50">
                    {step.description}
                  </p>
                </div>
                <span className="col-start-2 mt-1 self-start text-xs font-medium text-black/55 tabular-nums sm:col-start-3 sm:row-start-1 sm:mt-0">
                  {formatCreditEstimate(step.estimateCredits)}
                </span>
              </li>
            ))}
          </ol>

          <div className="grid gap-3 px-4 py-4">
            <div className="flex items-center justify-between gap-4 text-sm font-semibold text-black/75">
              <span>Estimated total</span>
              <span className="shrink-0 tabular-nums">
                {formatCreditEstimate(waitpoint.payload.totalEstimate)} credits
              </span>
            </div>
            {waitpoint.payload.notes ? (
              <p className="text-xs leading-5 text-black/55 italic">
                {waitpoint.payload.notes}
              </p>
            ) : null}
          </div>

          {pending && showFeedback ? (
            <div className="border-t border-black/8 bg-black/[0.015] px-4 py-4">
              <label
                htmlFor={`plan-feedback-${waitpoint.id}`}
                className="text-xs font-medium text-black/65"
              >
                What should change?
              </label>
              <textarea
                id={`plan-feedback-${waitpoint.id}`}
                value={feedback}
                maxLength={4_000}
                rows={3}
                disabled={isSubmitting}
                onChange={(event) => {
                  setFeedback(event.target.value);
                  if (event.target.value.trim()) setFeedbackError(null);
                }}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    (event.metaKey || event.ctrlKey)
                  ) {
                    event.preventDefault();
                    void submitFeedback();
                  }
                }}
                placeholder="Use a smaller size, change the order…"
                className="mt-2 w-full resize-y rounded-xl border border-black/12 bg-white px-3 py-2.5 text-sm leading-5 outline-none focus:border-violet-400 disabled:opacity-60"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-[11px] text-black/40">
                  ⌘/Ctrl + Enter to submit
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setShowFeedback(false);
                      setFeedbackError(null);
                    }}
                    className="rounded-lg px-3 py-2 text-xs font-medium text-black/55 hover:bg-black/5 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting || !feedback.trim()}
                    onClick={() => void submitFeedback()}
                    className="rounded-lg bg-[#252520] px-3 py-2 text-xs font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isSubmitting ? "Submitting…" : "Submit changes"}
                  </button>
                </div>
              </div>
              {feedbackError ? (
                <p className="mt-2 text-xs text-red-700">{feedbackError}</p>
              ) : null}
            </div>
          ) : null}

          {pending ? (
            <div className="flex flex-col gap-3 border-t border-black/8 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-black/40">
                Focus card, then press Enter to run all
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                {waitpoint.supportedResolutions.map((resolution) => (
                  <button
                    key={resolution}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      if (resolution === "REQUEST_CHANGES") {
                        setShowFeedback(true);
                        return;
                      }

                      void submitResolution(resolution);
                    }}
                    className={actionClassName(resolution)}
                  >
                    {isSubmitting ? "Submitting…" : ACTION_LABELS[resolution]}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <StatusNotice waitpoint={waitpoint} />
          )}

          {error ? (
            <p className="border-t border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
              {error.message} Try again; same approval key will be reused.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function StatusNotice({ waitpoint }: { waitpoint: Waitpoint }) {
  const copy =
    waitpoint.status === "EXPIRED"
      ? "This plan expired. Send the request again to create a fresh plan."
      : waitpoint.status === "CANCELLED"
        ? "This approval was cancelled and cannot be submitted."
        : waitpoint.resolution === "REQUEST_CHANGES"
          ? "Changes requested. Agent is preparing an updated plan."
          : waitpoint.resolution === "STEP_BY_STEP"
            ? "Step-by-step execution selected."
            : "Plan approved. Execution can continue.";

  return (
    <p className="border-t border-black/8 px-4 py-3 text-xs text-black/50">
      {copy}
    </p>
  );
}

function statusLabel(waitpoint: Waitpoint) {
  switch (waitpoint.status) {
    case "PENDING":
      return `${waitpoint.payload.steps.length} ${waitpoint.payload.steps.length === 1 ? "step" : "steps"} awaiting approval`;
    case "RESOLVED":
      return waitpoint.resolution === "REQUEST_CHANGES"
        ? "Changes requested"
        : "Plan approved";
    case "EXPIRED":
      return "Approval expired";
    case "CANCELLED":
      return "Approval cancelled";
  }
}

function statusGlyph(status: Waitpoint["status"]) {
  const glyphs: Record<Waitpoint["status"], string> = {
    PENDING: "☷",
    RESOLVED: "✓",
    EXPIRED: "!",
    CANCELLED: "×",
  };

  return glyphs[status];
}

function statusTone(status: Waitpoint["status"]) {
  const tones: Record<Waitpoint["status"], string> = {
    PENDING: "bg-violet-50 text-violet-700",
    RESOLVED: "bg-emerald-50 text-emerald-700",
    EXPIRED: "bg-amber-50 text-amber-700",
    CANCELLED: "bg-black/5 text-black/45",
  };

  return tones[status];
}

function actionClassName(resolution: Resolution) {
  return resolution === "RUN_ALL"
    ? "rounded-lg bg-[#252520] px-3.5 py-2 text-xs font-medium text-white hover:bg-black disabled:cursor-wait disabled:opacity-50"
    : "rounded-lg border border-black/12 bg-white px-3.5 py-2 text-xs font-medium text-black/65 hover:bg-black/[0.03] disabled:cursor-wait disabled:opacity-50";
}
