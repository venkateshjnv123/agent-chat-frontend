import { create } from "zustand";

type StreamBufferState = {
  textByRunId: Record<string, string>;
  append: (runId: string, chunk: string) => void;
  clear: (runId: string) => void;
};

export const useStreamBuffer = create<StreamBufferState>((set) => ({
  textByRunId: {},
  append: (runId, chunk) =>
    set((state) => ({
      textByRunId: {
        ...state.textByRunId,
        [runId]: `${state.textByRunId[runId] ?? ""}${chunk}`,
      },
    })),
  clear: (runId) =>
    set((state) => {
      const textByRunId = { ...state.textByRunId };
      delete textByRunId[runId];
      return { textByRunId };
    }),
}));
