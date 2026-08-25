import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RouteState } from "@/components/routes/RouteState";

describe("RouteState", () => {
  it("renders a named state and optional recovery action", () => {
    render(
      <RouteState
        title="Chat not found"
        description="This chat is unavailable."
        action={<button type="button">Start new chat</button>}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Chat not found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start new chat" }),
    ).toBeInTheDocument();
  });
});
