import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useRunMonitor } from "@/lib/realtime/useRunMonitor";

const mocks = vi.hoisted(() => ({
  agentRun: vi.fn(),
  mintToken: vi.fn(),
  realtime: vi.fn(),
  refetchToken: vi.fn(),
  tokenData: undefined as
    | undefined
    | {
        expiresAt: string;
        realtimeRunId: string;
        realtimeToken: string;
        runId: string;
      },
}));

vi.mock("@trigger.dev/react-hooks", () => ({
  useRealtimeRun: mocks.realtime,
}));

vi.mock("@/queries/useRun", () => ({
  useAgentRun: mocks.agentRun,
  useRealtimeToken: mocks.mintToken,
}));

describe("useRunMonitor", () => {
  beforeEach(() => {
    mocks.agentRun.mockReset().mockReturnValue({ data: undefined });
    mocks.mintToken.mockReset().mockImplementation(() => ({
      data: mocks.tokenData,
      error: null,
      refetch: mocks.refetchToken,
    }));
    mocks.realtime.mockReset().mockReturnValue({
      error: undefined,
      run: undefined,
    });
    mocks.refetchToken.mockReset();
    mocks.tokenData = undefined;
  });

  afterEach(() => vi.useRealTimers());

  it("subscribes with the Trigger run id while keeping the internal id for REST", () => {
    renderHook(() =>
      useRunMonitor({
        chatId: "chat-1",
        runId: "internal-run-1",
        initialRealtimeRunId: "trigger-run-1",
        initialRealtimeToken: "token-1",
        onTerminal: vi.fn(),
      }),
    );

    expect(mocks.realtime).toHaveBeenCalledWith(
      "trigger-run-1",
      expect.objectContaining({ accessToken: "token-1", enabled: true }),
    );
    expect(mocks.agentRun).toHaveBeenCalledWith(
      "chat-1",
      "internal-run-1",
      false,
    );
    expect(mocks.mintToken).toHaveBeenCalledWith("internal-run-1", true);
  });

  it("mints a fresh token on reload and subscribes to its realtime run id", () => {
    mocks.tokenData = {
      expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
      realtimeRunId: "trigger-run-fresh",
      realtimeToken: "token-fresh",
      runId: "internal-run-1",
    };

    renderHook(() =>
      useRunMonitor({
        chatId: "chat-1",
        runId: "internal-run-1",
        onTerminal: vi.fn(),
      }),
    );

    expect(mocks.mintToken).toHaveBeenCalledWith("internal-run-1", true);
    expect(mocks.realtime).toHaveBeenCalledWith(
      "trigger-run-fresh",
      expect.objectContaining({ accessToken: "token-fresh", enabled: true }),
    );
  });

  it("bounds realtime recovery and polls REST while degraded", async () => {
    vi.useFakeTimers();
    mocks.realtime.mockReturnValue({
      error: new Error("socket closed"),
      run: undefined,
    });
    mocks.refetchToken.mockResolvedValue({ error: new Error("token failed") });

    renderHook(() =>
      useRunMonitor({
        chatId: "chat-1",
        runId: "internal-run-1",
        initialRealtimeRunId: "trigger-run-1",
        initialRealtimeToken: "token-1",
        onTerminal: vi.fn(),
      }),
    );

    expect(mocks.agentRun).toHaveBeenCalledWith(
      "chat-1",
      "internal-run-1",
      true,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4_000);
    });

    expect(mocks.refetchToken).toHaveBeenCalledTimes(3);
  });
});
