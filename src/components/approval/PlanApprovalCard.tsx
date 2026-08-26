"use client";

import { useRef, useState } from "react";

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
const ACTION_ORDER: readonly Resolution[] = [
  "REQUEST_CHANGES",
  "STEP_BY_STEP",
  "RUN_ALL",
];

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
  const submissionLocked = useRef(false);
  const resolutionAttempt = useRef<{
    signature: string;
    idempotencyKey: string;
  } | null>(null);
  const canRunAll = waitpoint.supportedResolutions.includes("RUN_ALL");
  const supportedActions = ACTION_ORDER.filter((resolution) =>
    waitpoint.supportedResolutions.includes(resolution),
  );

  const submitResolution = async (
    resolution: Resolution,
    submittedFeedback?: string,
  ) => {
    if (!pending || isSubmitting || submissionLocked.current) return;

    submissionLocked.current = true;

    const signature = `${resolution}\u0000${submittedFeedback ?? ""}`;
    const idempotencyKey =
      resolutionAttempt.current?.signature === signature
        ? resolutionAttempt.current.idempotencyKey
        : crypto.randomUUID();
    resolutionAttempt.current = { signature, idempotencyKey };

    try {
      await onResolve({
        resolution,
        idempotencyKey,
        ...(submittedFeedback ? { feedback: submittedFeedback } : {}),
      });
    } catch {
      // Mutation state renders error. Keep card interactive for same-key retry.
    } finally {
      submissionLocked.current = false;
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
          showFeedback ||
          isSubmitting ||
          !canRunAll
        ) {
          return;
        }

        event.preventDefault();
        void submitResolution("RUN_ALL");
      }}
      className="max-w-full min-w-0 overflow-hidden rounded-xl border border-[#dedede] bg-white text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a8a8a]"
    >
      {pending ? (
        <div className="border-b border-[#ededed] px-5 py-4">
          <h3 className="text-[14px] leading-5 font-semibold text-[#1b1b1b]">
            {waitpoint.payload.title}
          </h3>
          <p className="mt-1 text-[14px] leading-6 text-[#585858]">
            {waitpoint.payload.overview}
          </p>
        </div>
      ) : (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#fafafa]"
        >
          <span
            aria-hidden="true"
            className={`grid size-7 shrink-0 place-items-center rounded-[10px] text-sm ${statusTone(waitpoint.status)}`}
          >
            {statusGlyph(waitpoint.status)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold text-[#1b1b1b]">
              {waitpoint.payload.title}
            </span>
            <span className="mt-0.5 block text-[12px] text-[#777777]">
              {statusLabel(waitpoint)}
            </span>
          </span>
          <span
            aria-hidden="true"
            className={`text-xs text-[#777777] transition ${open ? "rotate-180" : ""}`}
          >
            ⌄
          </span>
        </button>
      )}

      {open ? (
        <div className="border-t border-black/8">
          {!pending ? (
            <div className="px-4 py-4">
              <p className="text-[14px] leading-6 text-[#585858]">
                {waitpoint.payload.overview}
              </p>
            </div>
          ) : null}

          <ol className="divide-y divide-[#ededed]">
            {waitpoint.payload.steps.map((step) => (
              <li
                key={`${waitpoint.id}:step:${step.id}`}
                className="grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)] gap-2 px-5 py-4 sm:grid-cols-[1.5rem_minmax(0,1fr)_auto]"
              >
                <span
                  aria-label={`Step ${step.n}: ${step.status.toLowerCase()}`}
                  className={`mt-0.5 grid size-4 place-items-center text-[10px] font-medium tabular-nums ${stepStatusTone(step.status)}`}
                >
                  {step.status === "COMPLETED" ? "✓" : step.n}
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] leading-5 font-medium text-[#1b1b1b]">
                    {step.title}
                  </p>
                  <p className="mt-1 max-w-full text-[14px] leading-5 [overflow-wrap:anywhere] break-words text-[#585858]">
                    {step.description}
                  </p>
                  {step.dependsOn.length > 0 ? (
                    <p className="mt-1 text-[12px] text-[#777777]">
                      After {step.dependsOn.join(", ")}
                    </p>
                  ) : null}
                </div>
                <span className="col-start-2 mt-1 self-start text-[12px] font-normal text-[#585858] tabular-nums sm:col-start-3 sm:row-start-1 sm:mt-0">
                  {formatCreditEstimate(step.estimateCredits)}
                </span>
              </li>
            ))}
          </ol>

          <div className="grid gap-3 border-t border-[#ededed] px-5 py-4">
            <div className="flex items-center justify-between gap-4 text-[14px] font-medium text-[#1b1b1b]">
              <span>Estimated total</span>
              <span className="shrink-0 tabular-nums">
                {formatCreditEstimate(waitpoint.payload.totalEstimate)} credits
              </span>
            </div>
            {waitpoint.payload.notes ? (
              <p className="text-[14px] leading-5 text-[#1b1b1b] italic">
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
              <p className="mt-1 text-[11px] leading-4 text-black/45">
                Describe a revision to the plan. To approve it unchanged, cancel
                and choose Run All.
              </p>
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

          {pending && !showFeedback ? (
            <div className="flex flex-col gap-3 border-t border-[#ededed] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] text-[#585858]">
                <kbd className="mr-1 rounded border border-[#dedede] bg-[#fafafa] px-1.5 py-0.5 text-[10px] text-[#1b1b1b]">
                  Enter
                </kbd>
                run all
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                {supportedActions.map((resolution) => (
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
              {approvalErrorMessage(error)}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function approvalErrorMessage(error: Error) {
  if (error.message.includes("different decision")) {
    return "Another approval action is already processing. The current plan will refresh automatically.";
  }

  return `${error.message} Retry the same action if needed.`;
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

function stepStatusTone(
  status: Waitpoint["payload"]["steps"][number]["status"],
) {
  if (status === "COMPLETED") return "text-emerald-700";
  if (status === "FAILED") return "text-red-700";
  if (status === "RUNNING") return "text-blue-700";
  if (status === "SKIPPED") return "text-[#919191]";
  return "text-[#585858]";
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
    ? "h-8 rounded-[10px] bg-[#2b2b2b] px-3.5 text-[12px] font-medium text-white hover:bg-[#222] disabled:cursor-wait disabled:opacity-50"
    : "h-8 rounded-[10px] border border-[#dedede] bg-white px-3.5 text-[12px] font-medium text-[#1b1b1b] hover:bg-[#f7f7f7] disabled:cursor-wait disabled:opacity-50";
}
