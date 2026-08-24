import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ChatShell } from "@/components/chat/ChatShell";

describe("ChatShell", () => {
  it("exposes accessible empty-state composer controls", async () => {
    const user = userEvent.setup();
    render(<ChatShell />);

    expect(
      screen.getByRole("heading", { name: "What can I help you create?" }),
    ).toBeInTheDocument();

    const send = screen.getByRole("button", { name: "Send message" });
    expect(send).toBeDisabled();

    await user.type(screen.getByLabelText("Message"), "Hello");
    expect(send).toBeEnabled();
  });
});
