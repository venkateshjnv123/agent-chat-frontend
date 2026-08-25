import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Composer } from "@/components/chat/Composer";

describe("Composer", () => {
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
});
