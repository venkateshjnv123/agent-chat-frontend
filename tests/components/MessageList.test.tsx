import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MessageList } from "@/components/chat/MessageList";
import type { Message } from "@/contracts/generated";
import type { AssistantStreamBuffer } from "@/stores/assistantStream";

vi.mock("@/components/approval/MessageWaitpoint", () => ({
  MessageWaitpoint: () => null,
}));

describe("MessageList", () => {
  it("renders newest-first API data as an oldest-to-newest conversation", () => {
    render(
      <MessageList
        messages={[
          message("newest", 3, "Newest message"),
          message("middle", 2, "Middle message"),
          message("oldest", 1, "Oldest message"),
        ]}
        isLoading={false}
        error={null}
        hasOlder={false}
        isLoadingOlder={false}
        onLoadOlder={vi.fn()}
        realtimeDegraded={false}
      />,
    );

    expect(
      screen.getAllByRole("article").map((item) => item.textContent),
    ).toEqual([
      expect.stringContaining("Oldest message"),
      expect.stringContaining("Middle message"),
      expect.stringContaining("Newest message"),
    ]);
  });

  it("keeps wrapped user-message text left aligned inside a right-side bubble", () => {
    const rendered = render(
      <MessageList
        messages={[
          message("user", 1, "A long user message that wraps", {
            role: "USER",
          }),
        ]}
        isLoading={false}
        error={null}
        hasOlder={false}
        isLoadingOlder={false}
        onLoadOlder={vi.fn()}
        realtimeDegraded={false}
      />,
    );

    const bubble = within(rendered.container).getByText(
      "A long user message that wraps",
    );
    const timestamp = bubble.closest("article")?.querySelector("p");

    expect(bubble).toHaveClass("whitespace-pre-wrap");
    expect(bubble).toHaveClass("text-left");
    expect(timestamp).toHaveClass("text-right");
  });

  it("does not invent research activity for an empty pending message", () => {
    render(
      <MessageList
        messages={[message("pending", 1, "", { status: "PENDING" })]}
        isLoading={false}
        error={null}
        hasOlder={false}
        isLoadingOlder={false}
        onLoadOlder={vi.fn()}
        realtimeDegraded={false}
      />,
    );

    expect(screen.queryByText(/Working ·/)).not.toBeInTheDocument();
    expect(screen.queryByText("Researching request")).not.toBeInTheDocument();
    expect(screen.queryByText("Thinking…")).not.toBeInTheDocument();
  });

  it("restores attached user images above message text", () => {
    render(
      <MessageList
        messages={[
          message(
            "user-with-image",
            1,
            "Animate this\n\nAttached images:\n1.",
            {
              role: "USER",
              attachments: [
                {
                  id: "attachment-1",
                  status: "READY",
                  filename: "puppy.png",
                  mimeType: "image/png",
                  fileSize: 123,
                  width: 100,
                  height: 100,
                  url: "https://assets.example.test/puppy.png",
                  order: 0,
                  createdAt: "2026-08-26T00:00:00.000Z",
                  userMessage: null,
                },
              ],
            },
          ),
        ]}
        isLoading={false}
        error={null}
        hasOlder={false}
        isLoadingOlder={false}
        onLoadOlder={vi.fn()}
        realtimeDegraded={false}
      />,
    );

    const image = screen.getByRole("img", { name: "puppy.png" });
    const text = screen.getByText("Animate this");
    expect(
      image.compareDocumentPosition(text) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.queryByText(/Attached images/i)).not.toBeInTheDocument();
  });

  it("renders a bare generated-media URL as media instead of chat text", () => {
    const imageUrl = "https://assets.example.test/generated-result.png";

    render(
      <MessageList
        messages={[message("generated-image", 1, `Done.\n\n${imageUrl}`)]}
        isLoading={false}
        error={null}
        hasOlder={false}
        isLoadingOlder={false}
        onLoadOlder={vi.fn()}
        realtimeDegraded={false}
      />,
    );

    expect(
      screen.getByRole("img", { name: "Generated media" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(imageUrl)).not.toBeInTheDocument();
  });

  it("groups tool steps and removes duplicate markdown media links", () => {
    const imageUrl = "https://assets.example.test/result.png";

    const rendered = render(
      <MessageList
        messages={[
          message(
            "completed",
            1,
            `Created it.\n\n![generated result](${imageUrl})\n\nDone.`,
            {
              toolInvocations: [
                {
                  id: "tool-1",
                  toolName: "gpt_image_2_text",
                  rendererKey: "image",
                  state: "COMPLETED",
                  sanitizedInput: { prompt: "A red cube" },
                  result: {
                    type: "image",
                    urls: [imageUrl],
                    width: 1024,
                    height: 1024,
                    mimeType: "image/png",
                  },
                  resultUrl: imageUrl,
                  userMessage: null,
                  creditUsed: 210_000,
                  startedAt: "2026-08-25T10:00:00.000Z",
                  completedAt: "2026-08-25T10:00:10.000Z",
                },
              ],
            },
          ),
        ]}
        isLoading={false}
        error={null}
        hasOlder={false}
        isLoadingOlder={false}
        onLoadOlder={vi.fn()}
        realtimeDegraded={false}
      />,
    );

    expect(
      within(rendered.container).getByText("Working · 1 step"),
    ).toBeInTheDocument();
    expect(
      within(rendered.container).getByText(/Created it/),
    ).toHaveTextContent("Created it. Done.");
    expect(
      within(rendered.container).queryByText(/generated result/),
    ).not.toBeInTheDocument();
    expect(
      within(rendered.container).getByRole("img", {
        name: "Gpt Image 2 Text result 1",
      }),
    ).toBeInTheDocument();
  });

  it("renders live text/progress once and lets terminal REST content replace it", () => {
    const pending = message("assistant-1", 1, "", {
      runId: "run-1",
      status: "STREAMING",
    });
    const streamBuffer: AssistantStreamBuffer = {
      runId: "run-1",
      messageId: "assistant-1",
      text: "Streaming answer",
      textSequence: 2,
      activity: [
        {
          runId: "run-1",
          messageId: "assistant-1",
          sequence: 1,
          type: "progress",
          stage: "responding",
          currentStep: "Writing response",
          progress: 0.5,
        },
      ],
      activitySequence: 1,
      metadata: null,
    };
    const props = {
      isLoading: false,
      error: null,
      hasOlder: false,
      isLoadingOlder: false,
      onLoadOlder: vi.fn(),
      realtimeDegraded: false,
      streamBuffer,
    };
    const rendered = render(<MessageList {...props} messages={[pending]} />);

    expect(screen.getByText("Streaming answer")).toBeInTheDocument();
    expect(screen.getByText("Writing response")).toBeInTheDocument();
    expect(screen.queryAllByText("Streaming answer")).toHaveLength(1);

    rendered.rerender(
      <MessageList
        {...props}
        messages={[
          message("assistant-1", 1, "Saved terminal answer", {
            runId: "run-1",
          }),
        ]}
      />,
    );

    expect(screen.getByText("Saved terminal answer")).toBeInTheDocument();
    expect(screen.queryByText("Streaming answer")).not.toBeInTheDocument();
  });
});

function message(
  id: string,
  sequence: number,
  content: string,
  overrides: Partial<Message> = {},
): Message {
  return {
    aiModel: null,
    assets: null,
    attachments: [],
    chatId: "chat-1",
    content,
    contentBlocks: null,
    createdAt: `2026-08-25T10:0${sequence}:00.000Z`,
    creditUsed: 0,
    id,
    metadata: null,
    role: "ASSISTANT",
    runId: null,
    sequence: String(sequence),
    status: "SUCCESS",
    tokenUsage: null,
    toolInvocations: [],
    ...overrides,
  };
}
