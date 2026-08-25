import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChatShell } from "@/components/chat/ChatShell";
import { useActiveRunStore } from "@/stores/activeRun";

const mocks = vi.hoisted(() => ({
  cancelRun: vi.fn(),
  fetchChats: vi.fn(),
  fetchMessages: vi.fn(),
  messages: [] as Array<Record<string, unknown>>,
  sendMessage: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({
  UserButton: () => <span>Account menu</span>,
}));

vi.mock("@/queries/useChats", () => ({
  useChats: () => ({
    chats: [],
    error: null,
    fetchNextPage: mocks.fetchChats,
    hasNextPage: false,
    isFetchingNextPage: false,
    isPending: false,
    refetch: mocks.fetchChats,
  }),
}));

vi.mock("@/queries/useMessages", () => ({
  useMessages: () => ({
    error: null,
    fetchNextPage: mocks.fetchMessages,
    hasNextPage: false,
    isFetchingNextPage: false,
    isPending: false,
    messages: mocks.messages,
  }),
  useSendMessage: () => ({
    error: null,
    isPending: false,
    mutateAsync: mocks.sendMessage,
  }),
}));

vi.mock("@/queries/useRun", () => ({
  useCancelRun: () => ({
    error: null,
    isPending: false,
    mutateAsync: mocks.cancelRun,
  }),
}));

vi.mock("@/lib/realtime/useRunMonitor", () => ({
  useRunMonitor: () => ({
    isRealtimeDegraded: false,
    run: undefined,
    triggerStatus: undefined,
  }),
}));

describe("ChatShell", () => {
  beforeEach(() => {
    mocks.cancelRun.mockReset();
    mocks.fetchChats.mockReset();
    mocks.fetchMessages.mockReset();
    mocks.sendMessage.mockReset();
    mocks.messages = [];
    window.history.replaceState(null, "", "/chat");
    useActiveRunStore.setState({ handle: null });
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
      "11111111-1111-4111-8111-111111111111",
    );
  });

  it("reuses the logical-send key and updates a new-chat URL without route navigation", async () => {
    const user = userEvent.setup();
    mocks.sendMessage
      .mockRejectedValueOnce(new Error("Temporary failure"))
      .mockResolvedValueOnce({
        chatId: "chat-1",
        messageId: "message-1",
        realtimeRunId: "trigger-run-1",
        realtimeToken: "token-1",
        runId: "run-1",
      });

    renderShell(<ChatShell />);

    const message = screen.getByLabelText("Message");
    const send = screen.getByRole("button", { name: "Send message" });
    await user.type(message, "Build the report");
    await user.click(send);

    await waitFor(() => expect(mocks.sendMessage).toHaveBeenCalledTimes(1));
    expect(message).toHaveValue("Build the report");

    await user.click(send);

    await waitFor(() => expect(window.location.pathname).toBe("/chat/chat-1"));
    const firstRequest = mocks.sendMessage.mock.calls[0]?.[0];
    const retryRequest = mocks.sendMessage.mock.calls[1]?.[0];
    expect(firstRequest).toEqual({
      content: "Build the report",
      idempotencyKey: "11111111-1111-4111-8111-111111111111",
    });
    expect(retryRequest).toEqual(firstRequest);
    expect(useActiveRunStore.getState().handle).toEqual({
      chatId: "chat-1",
      realtimeRunId: "trigger-run-1",
      realtimeToken: "token-1",
      runId: "run-1",
    });
  });

  it("cancels the active run and clears its ephemeral token", async () => {
    const user = userEvent.setup();
    mocks.cancelRun.mockResolvedValue({ runId: "run-1", status: "CANCELLED" });
    useActiveRunStore.getState().setHandle({
      chatId: "chat-1",
      realtimeToken: "token-1",
      runId: "run-1",
    });

    const rendered = renderShell(<ChatShell chatId="chat-1" title="Report" />);
    await user.click(
      within(rendered.container).getByRole("button", { name: "Stop run" }),
    );

    await waitFor(() => {
      expect(mocks.cancelRun).toHaveBeenCalledWith("run-1");
      expect(useActiveRunStore.getState().handle).toBeNull();
    });
  });
});

function renderShell(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  );
}
