import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Composer } from "@/components/chat/Composer";

const mocks = vi.hoisted(() => ({ uploadAttachment: vi.fn() }));

vi.mock("@/queries/useAttachments", () => ({
  useAttachmentUploader: () => mocks.uploadAttachment,
}));

describe("Composer", () => {
  beforeEach(() => mocks.uploadAttachment.mockReset());

  it("replaces the send arrow with a loader while the send is pending", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();

    render(
      <Composer
        context="chat"
        isSending
        isRunActive={false}
        isStopping={false}
        error={null}
        onSend={onSend}
        onStop={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Sending message" }),
    ).toBeDisabled();
    expect(screen.queryByText("↑")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Message"), "hello");
    expect(onSend).not.toHaveBeenCalled();
  });

  it("uploads an image and sends stable attachment ids in display order", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(undefined);
    mocks.uploadAttachment.mockResolvedValue({
      id: "attachment-1",
      status: "READY",
      filename: "puppy.png",
      mimeType: "image/png",
      fileSize: 3,
      width: 100,
      height: 100,
      url: "https://assets.example.test/puppy.png",
      order: 0,
      createdAt: "2026-08-26T00:00:00.000Z",
      userMessage: null,
    });

    render(
      <Composer
        context="new"
        isSending={false}
        isRunActive={false}
        isStopping={false}
        error={null}
        onSend={onSend}
        onStop={vi.fn()}
      />,
    );

    const file = new File(["png"], "puppy.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Upload image"), file);

    await waitFor(() =>
      expect(
        screen.getByRole("img", { name: "puppy.png" }),
      ).toBeInTheDocument(),
    );
    await user.type(screen.getByLabelText("Message"), "Animate this image");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(onSend).toHaveBeenCalledWith("Animate this image", ["attachment-1"]);
    expect(
      screen.queryByRole("img", { name: "puppy.png" }),
    ).not.toBeInTheDocument();
  });

  it("matches the reference controls and sends without a visible plan mode", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(
      <Composer
        context="new"
        isSending={false}
        isRunActive={false}
        isStopping={false}
        error={null}
        onSend={onSend}
        onStop={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Plan mode" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add attachment" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Connect tools" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Voice input" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add attachment" }));
    expect(
      screen.getByText(
        "Add a file from your device or select one from your library",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Select Asset" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Message"), "Build a campaign image");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(onSend).toHaveBeenCalledWith("Build a campaign image", []);
  });
});
