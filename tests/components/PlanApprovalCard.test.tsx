import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PlanApprovalCard } from "@/components/approval/PlanApprovalCard";
import type { Waitpoint } from "@/contracts/generated";

describe("PlanApprovalCard", () => {
  it("renders only server-supported resolutions and reuses its approval key", async () => {
    const user = userEvent.setup();
    const onResolve = vi.fn().mockRejectedValue(new Error("Temporary failure"));

    render(
      <PlanApprovalCard
        waitpoint={waitpoint()}
        isSubmitting={false}
        error={new Error("Temporary failure")}
        onResolve={onResolve}
      />,
    );

    expect(screen.getByRole("button", { name: "Run All" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Request Changes" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Step by Step" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Run All" }));
    await user.click(screen.getByRole("button", { name: "Run All" }));

    expect(onResolve).toHaveBeenCalledTimes(2);
    expect(onResolve.mock.calls[0]?.[0].idempotencyKey).toBe(
      onResolve.mock.calls[1]?.[0].idempotencyKey,
    );
    expect(
      onResolve.mock.calls[0]?.[0].idempotencyKey.length,
    ).toBeGreaterThanOrEqual(8);
  });

  it("scopes Enter to the card and keeps textarea Enter as a newline", async () => {
    const user = userEvent.setup();
    const onResolve = vi.fn().mockResolvedValue(undefined);

    render(
      <PlanApprovalCard
        waitpoint={waitpoint()}
        isSubmitting={false}
        error={null}
        onResolve={onResolve}
      />,
    );

    const card = screen.getByRole("region", { name: "Plan approval" });
    card.focus();
    await user.keyboard("{Enter}");
    expect(onResolve).toHaveBeenCalledWith(
      expect.objectContaining({ resolution: "RUN_ALL" }),
    );

    onResolve.mockClear();
    await user.click(screen.getByRole("button", { name: "Request Changes" }));
    const feedback = screen.getByLabelText("What should change?");
    await user.type(feedback, "Use smaller{Enter}images");

    expect(feedback).toHaveValue("Use smaller\nimages");
    expect(onResolve).not.toHaveBeenCalled();

    await user.keyboard("{Control>}{Enter}{/Control}");
    expect(onResolve).toHaveBeenCalledWith(
      expect.objectContaining({
        resolution: "REQUEST_CHANGES",
        feedback: "Use smaller\nimages",
      }),
    );
  });

  it("renders expired state collapsed and never offers actions", async () => {
    const user = userEvent.setup();

    render(
      <PlanApprovalCard
        waitpoint={waitpoint({ status: "EXPIRED" })}
        isSubmitting={false}
        error={null}
        onResolve={vi.fn()}
      />,
    );

    expect(screen.queryByText("This plan expired.")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Red cube plan/ }));
    expect(screen.getByText(/This plan expired/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Run All" }),
    ).not.toBeInTheDocument();
  });

  it("disables every resolution while one submit is in flight", () => {
    render(
      <PlanApprovalCard
        waitpoint={waitpoint()}
        isSubmitting
        error={null}
        onResolve={vi.fn()}
      />,
    );

    for (const button of screen.getAllByRole("button", {
      name: "Submitting…",
    })) {
      expect(button).toBeDisabled();
    }
  });

  it.each([
    {
      status: "RESOLVED" as const,
      resolution: "RUN_ALL" as const,
      label: "Plan approved",
      notice: "Plan approved. Execution can continue.",
    },
    {
      status: "CANCELLED" as const,
      resolution: null,
      label: "Approval cancelled",
      notice: "This approval was cancelled and cannot be submitted.",
    },
  ])("renders $status as collapsed history", async (state) => {
    const user = userEvent.setup();
    render(
      <PlanApprovalCard
        waitpoint={waitpoint({
          status: state.status,
          resolution: state.resolution,
        })}
        isSubmitting={false}
        error={null}
        onResolve={vi.fn()}
      />,
    );

    expect(screen.getByText(state.label)).toBeInTheDocument();
    expect(screen.queryByText(state.notice)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Red cube plan/ }));
    expect(screen.getByText(state.notice)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Run All" }),
    ).not.toBeInTheDocument();
  });
});

function waitpoint(overrides: Partial<Waitpoint> = {}): Waitpoint {
  return {
    id: "waitpoint-1",
    runId: "run-1",
    type: "PLAN_APPROVAL",
    status: "PENDING",
    payload: {
      title: "Red cube plan",
      overview: "Generate a cube, then crop it.",
      steps: [
        {
          n: 1,
          title: "Generate cube",
          description: "Create one high-quality image.",
          estimateCredits: 210_720,
        },
        {
          n: 2,
          title: "Crop cube",
          description: "Crop generated image to its left half.",
          estimateCredits: 5_000,
        },
      ],
      totalEstimate: 215_720,
      notes: "Step 2 uses step 1 output.",
    },
    resolution: null,
    supportedResolutions: ["RUN_ALL", "REQUEST_CHANGES"],
    expiresAt: "2026-08-25T13:00:00.000Z",
    resolvedAt: null,
    createdAt: "2026-08-25T12:00:00.000Z",
    ...overrides,
  };
}
