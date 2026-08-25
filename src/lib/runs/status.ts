import type { AgentRunState } from "@/contracts/generated";

export type AppRunStatus = AgentRunState["status"];

const TERMINAL_STATUSES = new Set<AppRunStatus>([
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);

export function isTerminalRunStatus(
  status: AppRunStatus | null | undefined,
): boolean {
  return status ? TERMINAL_STATUSES.has(status) : false;
}

export function isMessageWaitingForRun(status: string): boolean {
  return status === "PENDING" || status === "STREAMING";
}
