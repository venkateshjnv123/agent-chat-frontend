import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreditsView } from "@/components/credits/CreditsView";

vi.mock("@/components/chat/Sidebar", () => ({
  Sidebar: () => <aside>Sidebar</aside>,
}));

const mocks = vi.hoisted(() => ({
  credits: {} as Record<string, unknown>,
  ledger: {} as Record<string, unknown>,
  fetchNextPage: vi.fn(),
  refetchCredits: vi.fn(),
  refetchLedger: vi.fn(),
}));

vi.mock("@/queries/useCredits", () => ({
  useCredits: () => mocks.credits,
  useCreditLedger: () => mocks.ledger,
}));

describe("CreditsView", () => {
  beforeEach(() => {
    mocks.fetchNextPage.mockReset();
    mocks.refetchCredits.mockReset();
    mocks.refetchLedger.mockReset();
    mocks.credits = {
      data: {
        availableBalance: 4_784_280,
        reservedBalance: 215_720,
        formatted: "4.78",
      },
      error: null,
      isPending: false,
      refetch: mocks.refetchCredits,
    };
    mocks.ledger = {
      entries: [],
      error: null,
      fetchNextPage: mocks.fetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
      isPending: false,
      refetch: mocks.refetchLedger,
    };
  });

  it("renders a loading skeleton instead of a blank page", () => {
    mocks.credits = { ...mocks.credits, isPending: true };

    render(<CreditsView />);

    expect(
      screen.getByRole("status", { name: "Loading credits" }),
    ).toBeInTheDocument();
  });

  it("renders server balances and an honest empty ledger", () => {
    render(<CreditsView />);

    expect(screen.getByText("4.78M")).toBeInTheDocument();
    expect(screen.getByText("0.22M")).toBeInTheDocument();
    expect(screen.getByText("No credit activity yet")).toBeInTheDocument();
  });

  it("shows zero-rated rows and advances ledger cursor pages", async () => {
    const user = userEvent.setup();
    mocks.ledger = {
      ...mocks.ledger,
      entries: [
        {
          id: "ledger-1",
          delta: 0,
          kind: "SETTLE",
          toolName: null,
          runId: "run-1",
          toolInvocationId: null,
          zeroRated: true,
          note: "model usage recorded at zero application credits",
          createdAt: "2026-08-25T12:00:00.000Z",
        },
      ],
      hasNextPage: true,
    };

    render(<CreditsView />);

    expect(screen.getByText("Zero-rated")).toBeInTheDocument();
    expect(screen.getByText("OpenRouter model")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Detailed View" }));
    await user.click(
      screen.getByRole("button", { name: "Load older entries" }),
    );
    expect(mocks.fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("renders a retryable error state", async () => {
    const user = userEvent.setup();
    mocks.ledger = { ...mocks.ledger, error: new Error("Offline") };

    render(<CreditsView />);

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(mocks.refetchCredits).toHaveBeenCalledTimes(1);
    expect(mocks.refetchLedger).toHaveBeenCalledTimes(1);
  });
});
