"use client";

import type { Message } from "@/contracts/generated";
import { useResolveWaitpoint, useWaitpoint } from "@/queries/useWaitpoint";

import { PlanApprovalCard } from "./PlanApprovalCard";

export function MessageWaitpoint({ message }: { message: Message }) {
  const active = message.status === "PENDING" || message.status === "STREAMING";
  const waitpointQuery = useWaitpoint(message.runId, active);
  const resolveMutation = useResolveWaitpoint();

  if (!message.runId) return null;

  if (waitpointQuery.error && active) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <p>Could not restore approval state.</p>
        <button
          type="button"
          onClick={() => void waitpointQuery.refetch()}
          className="mt-1 font-medium underline underline-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }

  const waitpoints = waitpointQuery.data?.items ?? [];

  if (waitpoints.length === 0) return null;

  return (
    <div className="grid gap-3" aria-label="Approval history">
      {waitpoints.map((waitpoint) => (
        <PlanApprovalCard
          key={`${waitpoint.id}:${waitpoint.status}`}
          waitpoint={waitpoint}
          isSubmitting={
            resolveMutation.isPending &&
            resolveMutation.variables?.waitpointId === waitpoint.id
          }
          error={
            resolveMutation.variables?.waitpointId === waitpoint.id
              ? resolveMutation.error
              : null
          }
          onResolve={(request) =>
            resolveMutation
              .mutateAsync({
                chatId: message.chatId,
                runId: waitpoint.runId,
                waitpointId: waitpoint.id,
                request,
              })
              .then(() => undefined)
          }
        />
      ))}
    </div>
  );
}
