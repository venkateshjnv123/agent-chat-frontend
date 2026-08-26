import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TasksScreen } from "@/components/tasks/TasksScreen";

const chats = [
  {
    id: "chat-1",
    title: "Build the landing campaign",
    modelId: "auto",
    createdAt: "2026-08-25T14:00:00.000Z",
    updatedAt: "2026-08-25T15:00:00.000Z",
  },
  {
    id: "chat-2",
    title: "Create an image",
    modelId: "auto",
    createdAt: "2026-08-25T12:00:00.000Z",
    updatedAt: "2026-08-25T13:00:00.000Z",
  },
];

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: { fullName: "Venkatesh Patnala" } }),
  UserButton: () => <span>Account menu</span>,
}));

vi.mock("@/queries/useChats", () => ({
  useChats: () => ({
    chats,
    error: null,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isPending: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/queries/useCredits", () => ({
  useCredits: () => ({
    data: { availableBalance: 38_650_000, reservedBalance: 0 },
    error: null,
    isPending: false,
  }),
}));

describe("TasksScreen", () => {
  it("renders the Magica task index and filters by title", async () => {
    const user = userEvent.setup();
    render(<TasksScreen />);

    expect(screen.getByRole("heading", { name: "Tasks" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "New task" })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          pathname: "/chat",
        }),
      ]),
    );
    const taskList = within(screen.getByRole("region", { name: "Task list" }));
    expect(
      taskList.getByText("Build the landing campaign"),
    ).toBeInTheDocument();
    expect(taskList.getByText("Create an image")).toBeInTheDocument();

    await user.type(
      screen.getByRole("searchbox", { name: "Search tasks" }),
      "landing",
    );

    expect(
      taskList.getByText("Build the landing campaign"),
    ).toBeInTheDocument();
    expect(taskList.queryByText("Create an image")).not.toBeInTheDocument();
  });
});
