import { create } from "zustand";

export type ActiveRunHandle = {
  chatId: string;
  runId: string;
  realtimeRunId?: string;
  realtimeToken: string;
};

type ActiveRunState = {
  handle: ActiveRunHandle | null;
  setHandle: (handle: ActiveRunHandle) => void;
  clearHandle: (runId?: string) => void;
};

/** Ephemeral bridge across first-send router.replace. Reload mints a fresh token. */
export const useActiveRunStore = create<ActiveRunState>((set) => ({
  handle: null,
  setHandle: (handle) => set({ handle }),
  clearHandle: (runId) =>
    set((state) =>
      !runId || state.handle?.runId === runId ? { handle: null } : state,
    ),
}));
