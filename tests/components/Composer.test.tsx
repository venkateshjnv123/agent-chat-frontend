import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Composer } from "@/components/chat/Composer";

const mocks = vi.hoisted(() => ({ uploadAttachment: vi.fn() }));

vi.mock("@/queries/useAttachments", () => ({
  useAttachmentUploader: () => mocks.uploadAttachment,
}));

describe("Composer", () => {
  beforeEach(() => {
    mocks.uploadAttachment.mockReset();
    sessionStorage.clear();
  });

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
    await user.upload(screen.getByLabelText("Upload media"), file);

    await waitFor(() =>
      expect(
        screen.getByRole("img", { name: "puppy.png" }),
      ).toBeInTheDocument(),
    );
    await user.type(screen.getByLabelText("Message"), "Animate this image");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(onSend).toHaveBeenCalledWith(
      "Animate this image",
      ["attachment-1"],
      false,
    );
    expect(
      screen.queryByRole("img", { name: "puppy.png" }),
    ).not.toBeInTheDocument();
  });

  it("uploads videos and sends their attachment ids in selection order", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(undefined);
    mocks.uploadAttachment
      .mockResolvedValueOnce({
        id: "video-1",
        status: "READY",
        filename: "first.mp4",
        mimeType: "video/mp4",
        fileSize: 5,
        width: 1280,
        height: 720,
        url: "https://assets.example.test/first.mp4",
        order: 0,
        createdAt: "2026-08-26T00:00:00.000Z",
        userMessage: null,
      })
      .mockResolvedValueOnce({
        id: "video-2",
        status: "READY",
        filename: "second.webm",
        mimeType: "video/webm",
        fileSize: 6,
        width: 1280,
        height: 720,
        url: "https://assets.example.test/second.webm",
        order: 1,
        createdAt: "2026-08-26T00:00:01.000Z",
        userMessage: null,
      });

    render(
      <Composer
        context="chat"
        isSending={false}
        isRunActive={false}
        isStopping={false}
        error={null}
        onSend={onSend}
        onStop={vi.fn()}
      />,
    );

    const input = screen.getByLabelText("Upload media");
    expect(input).toHaveAttribute(
      "accept",
      expect.stringContaining("video/mp4"),
    );

    await user.upload(input, [
      new File(["first"], "first.mp4", { type: "video/mp4" }),
      new File(["second"], "second.webm", { type: "video/webm" }),
    ]);

    await waitFor(() => {
      expect(screen.getByLabelText("first.mp4")).toBeInTheDocument();
      expect(screen.getByLabelText("second.webm")).toBeInTheDocument();
    });
    await user.type(
      screen.getByLabelText("Message"),
      "Merge these videos in this order",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(onSend).toHaveBeenCalledWith(
      "Merge these videos in this order",
      ["video-1", "video-2"],
      false,
    );
  });

  it("matches Magica's composer controls and sends plan mode disabled", async () => {
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

    expect(onSend).toHaveBeenCalledWith("Build a campaign image", [], false);
  });
});
