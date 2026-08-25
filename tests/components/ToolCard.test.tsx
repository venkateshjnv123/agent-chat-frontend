import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ToolCard } from "@/components/chat/ToolCard";
import type { ToolInvocation } from "@/contracts/generated";

describe("ToolCard", () => {
  it("renders a completed image result through its renderer key", () => {
    render(
      <ToolCard
        invocation={toolInvocation({
          toolName: "crop_image",
          rendererKey: "image",
          state: "COMPLETED",
          result: {
            type: "image",
            urls: ["https://assets.example.test/cropped.png"],
            width: 512,
            height: 512,
            mimeType: "image/png",
          },
          creditUsed: 125_000,
          startedAt: "2026-08-25T10:00:00.000Z",
          completedAt: "2026-08-25T10:00:01.400Z",
        })}
      />,
    );

    expect(
      screen.getByRole("region", { name: "Crop Image tool step" }),
    ).toHaveTextContent("Completed");
    expect(screen.getByText("1 image ready")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Crop Image result 1" }),
    ).toHaveAttribute("src", "https://assets.example.test/cropped.png");
    expect(
      screen.getByRole("link", { name: "Open Crop Image image 1" }),
    ).toHaveAttribute("href", "https://assets.example.test/cropped.png");
    expect(screen.getByText("1.4s")).toBeInTheDocument();
    expect(screen.getByText("0.1250M credits")).toBeInTheDocument();
  });

  it("renders safe failure details without requiring a result", () => {
    render(
      <ToolCard
        invocation={toolInvocation({
          toolName: "merge_videos",
          state: "FAILED",
          userMessage: "Two video inputs are required.",
          startedAt: "2026-08-25T10:00:00.000Z",
          completedAt: "2026-08-25T10:00:00.007Z",
        })}
      />,
    );

    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("7ms")).toBeInTheDocument();
    expect(
      screen.getByText("Two video inputs are required."),
    ).toBeInTheDocument();
  });

  it("renders running state without inventing a duration", () => {
    render(
      <ToolCard
        invocation={toolInvocation({
          toolName: "gpt_image_2",
          rendererKey: "image",
          state: "RUNNING",
          startedAt: "2026-08-25T10:00:00.000Z",
        })}
      />,
    );

    const card = screen.getByRole("region", {
      name: "Gpt Image 2 tool step",
    });

    expect(within(card).getByText("Running")).toBeInTheDocument();
    expect(within(card).queryByText(/^\d+(?:ms|s)$/)).not.toBeInTheDocument();
  });

  it("uses typed data results for generic renderers", () => {
    render(
      <ToolCard
        invocation={toolInvocation({
          toolName: "get_model_schema",
          rendererKey: "generic",
          state: "COMPLETED",
          result: {
            type: "data",
            data: { modelId: "gpt-image-2-edit", supportsEdit: true },
          },
        })}
      />,
    );

    expect(screen.getByText("Model Id")).toBeInTheDocument();
    expect(screen.getByText("gpt-image-2-edit")).toBeInTheDocument();
    expect(screen.getByText("Supports Edit")).toBeInTheDocument();
    expect(screen.getByText("true")).toBeInTheDocument();
  });

  it("renders a playable video and an external fallback link", () => {
    render(
      <ToolCard
        invocation={toolInvocation({
          toolName: "merge_videos",
          rendererKey: "video",
          state: "COMPLETED",
          result: {
            type: "video",
            urls: ["https://assets.example.test/merged.mp4"],
            durationSeconds: 12,
            mimeType: "video/mp4",
          },
        })}
      />,
    );

    expect(screen.getByLabelText("Merge Videos video 1")).toHaveAttribute(
      "src",
      "https://assets.example.test/merged.mp4",
    );
    expect(
      screen.getByRole("link", { name: "Open video in new tab" }),
    ).toHaveAttribute("href", "https://assets.example.test/merged.mp4");
  });
});

function toolInvocation(
  overrides: Partial<ToolInvocation> = {},
): ToolInvocation {
  return {
    id: "tool-1",
    toolName: "generic_tool",
    rendererKey: "generic",
    state: "PENDING",
    sanitizedInput: {},
    result: null,
    resultUrl: null,
    userMessage: null,
    creditUsed: 0,
    startedAt: null,
    completedAt: null,
    ...overrides,
  };
}
