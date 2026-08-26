import { create } from "zustand";

import type {
  AgentActivityEvent,
  AssistantTextDelta,
  RunMetadata,
} from "@/contracts/generated";

export type AssistantStreamBuffer = {
  runId: string;
  messageId: string;
  text: string;
  textSequence: number;
  activity: AgentActivityEvent[];
  activitySequence: number;
  metadata: RunMetadata | null;
};

type StreamSnapshot = AssistantStreamBuffer;

type AssistantStreamState = {
  byRunId: Record<string, AssistantStreamBuffer>;
  replaceSnapshot: (snapshot: StreamSnapshot) => void;
  clear: (runId: string) => void;
};

/** Ephemeral realtime state. Durable message REST data remains authoritative. */
export const useAssistantStreamStore = create<AssistantStreamState>((set) => ({
  byRunId: {},
  replaceSnapshot: (snapshot) =>
    set((state) => {
      const current = state.byRunId[snapshot.runId];
      const sameMessage = current?.messageId === snapshot.messageId;
      const next = sameMessage
        ? {
            ...snapshot,
            text:
              snapshot.textSequence >= current.textSequence
                ? snapshot.text
                : current.text,
            textSequence: Math.max(snapshot.textSequence, current.textSequence),
            activity:
              snapshot.activitySequence >= current.activitySequence
                ? snapshot.activity
                : current.activity,
            activitySequence: Math.max(
              snapshot.activitySequence,
              current.activitySequence,
            ),
            metadata: snapshot.metadata ?? current.metadata,
          }
        : snapshot;

      if (sameStreamBuffer(current, next)) return state;

      return {
        byRunId: {
          ...state.byRunId,
          [snapshot.runId]: next,
        },
      };
    }),
  clear: (runId) =>
    set((state) => {
      if (!(runId in state.byRunId)) return state;

      const next = { ...state.byRunId };
      delete next[runId];
      return { byRunId: next };
    }),
}));

export function buildStreamSnapshot(options: {
  runId: string;
  messageId: string;
  textDeltas: AssistantTextDelta[];
  activity: AgentActivityEvent[];
  metadata: RunMetadata | null;
}): StreamSnapshot {
  const textDeltas = uniqueBySequence(
    options.textDeltas.filter(
      (delta) =>
        delta.runId === options.runId && delta.messageId === options.messageId,
    ),
  );
  const activity = uniqueBySequence(
    options.activity.filter(
      (event) =>
        event.runId === options.runId && event.messageId === options.messageId,
    ),
  );

  return {
    runId: options.runId,
    messageId: options.messageId,
    text: textDeltas.map((delta) => delta.text).join(""),
    textSequence: textDeltas.at(-1)?.sequence ?? 0,
    activity,
    activitySequence: activity.at(-1)?.sequence ?? 0,
    metadata: metadataMatches(options.metadata, options)
      ? options.metadata
      : null,
  };
}

function uniqueBySequence<T extends { sequence: number }>(items: T[]) {
  const bySequence = new Map<number, T>();

  for (const item of [...items].sort(
    (left, right) => left.sequence - right.sequence,
  )) {
    if (!bySequence.has(item.sequence)) bySequence.set(item.sequence, item);
  }

  return [...bySequence.values()];
}

function metadataMatches(
  metadata: RunMetadata | null,
  identity: { runId: string; messageId: string },
) {
  if (!metadata) return false;
  if (metadata.runId && metadata.runId !== identity.runId) return false;
  if (metadata.messageId && metadata.messageId !== identity.messageId)
    return false;
  return true;
}

function sameStreamBuffer(
  left: AssistantStreamBuffer | undefined,
  right: AssistantStreamBuffer,
) {
  return (
    left?.messageId === right.messageId &&
    left.textSequence === right.textSequence &&
    left.activitySequence === right.activitySequence &&
    left.metadata === right.metadata
  );
}
