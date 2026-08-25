import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RetryTurn } from "@/components/chat/RetryTurn";
import type { Message } from "@/contracts/generated";
import { useActiveRunStore } from "@/stores/activeRun";

const mocks = vi.hoisted(() => ({
  refetch: vi.fn(),
  retry: vi.fn(),
}));

vi.mock("@/queries/useRun", () => ({
  useAgentRun: () => ({
    data: {
      id: "run-1",
      chatId: "chat-1",
      status: "FAILED",
      turns: 2,
      routedModel: "model",
      userMessage: "Provider unavailable.",
      retryable: true,
      cancellationRequestedAt: null,
      startedAt: "2026-08-26T00:00:00.000Z",
      completedAt: "2026-08-26T00:01:00.000Z",
    },
    error: null,
    isPending: false,
    refetch: mocks.refetch,
  }),
  useRetryRun: () => ({
    error: null,
    isPending: false,
    mutateAsync: mocks.retry,
  }),
}));

describe("RetryTurn", () => {
  beforeEach(() => {
    mocks.refetch.mockReset();
    mocks.retry.mockReset();
    useActiveRunStore.setState({ handle: null });
  });

  it("starts only backend-authorized retries and installs fresh realtime scope", async () => {
    const user = userEvent.setup();
    mocks.retry.mockResolvedValue({
      runId: "run-1",
      chatId: "chat-1",
      messageId: "assistant-1",
      status: "QUEUED",
      retried: true,
      attempt: 1,
      realtimeRunId: "trigger-2",
      realtimeToken: "scoped-token-2",
      reason: null,
    });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <RetryTurn message={failedMessage} />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Retry turn" }));

    await waitFor(() => expect(mocks.retry).toHaveBeenCalledWith("run-1"));
    expect(useActiveRunStore.getState().handle).toEqual({
      chatId: "chat-1",
      runId: "run-1",
      realtimeRunId: "trigger-2",
      realtimeToken: "scoped-token-2",
    });
    expect(screen.getByText("Retry started.")).toBeInTheDocument();
  });
});

const failedMessage: Message = {
  aiModel: null,
  assets: null,
  attachments: [],
  chatId: "chat-1",
  content: "Provider unavailable.",
  contentBlocks: null,
  createdAt: "2026-08-26T00:01:00.000Z",
  creditUsed: 0,
  id: "assistant-1",
  metadata: null,
  role: "ASSISTANT",
  runId: "run-1",
  sequence: "2",
  status: "FAILED",
  tokenUsage: null,
  toolInvocations: [],
};
