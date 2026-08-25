import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MessageList } from "@/components/chat/MessageList";
import type { Message } from "@/contracts/generated";

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
});

function message(id: string, sequence: number, content: string): Message {
  return {
    aiModel: null,
    assets: null,
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
  };
}
