"use client";

import { useEffect, useRef, useState } from "react";

import { LineIcon } from "@/components/ui/LineIcon";
import { useAttachmentUploader } from "@/queries/useAttachments";

type ComposerProps = {
  context: "new" | "chat";
  isSending: boolean;
  isRunActive: boolean;
  isStopping: boolean;
  error: Error | null;
  chatId?: string;
  onSend: (content: string, attachmentIds: string[]) => Promise<void>;
  onStop: () => Promise<void>;
};

type DraftAttachment = {
  localId: string;
  attachmentId?: string;
  filename: string;
  previewUrl: string;
  progress: number;
  status: "UPLOADING" | "READY" | "FAILED";
  error?: string;
};

const MAX_MESSAGE_LENGTH = 16_000;

export function Composer({
  context,
  isSending,
  isRunActive,
  isStopping,
  error,
  chatId,
  onSend,
  onStop,
}: ComposerProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<DraftAttachment[]>([]);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentRef = useRef<DraftAttachment[]>([]);
  const uploadControllers = useRef(new Map<string, AbortController>());
  const uploadAttachment = useAttachmentUploader(chatId);
  const isNewTask = context === "new";
  const attachmentsReady = attachments.every(
    (attachment) => attachment.status === "READY",
  );
  const canSend =
    message.trim().length > 0 &&
    message.length <= MAX_MESSAGE_LENGTH &&
    attachmentsReady &&
    !isSending &&
    !isRunActive;

  useEffect(() => {
    attachmentRef.current = attachments;
  }, [attachments]);

  useEffect(
    () => () => {
      for (const controller of uploadControllers.current.values()) {
        controller.abort();
      }
      for (const attachment of attachmentRef.current) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    },
    [],
  );

  const submit = async () => {
    if (!canSend) return;

    try {
      await onSend(
        message,
        attachments.flatMap((attachment) =>
          attachment.status === "READY" && attachment.attachmentId
            ? [attachment.attachmentId]
            : [],
        ),
      );
      setMessage("");
      setAttachmentMenuOpen(false);
      clearAttachments();
    } catch {
      // Mutation state renders the API error and keeps the draft for retry.
    }
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const available = Math.max(0, 10 - attachments.length);

    for (const file of Array.from(files).slice(0, available)) {
      const localId = crypto.randomUUID();
      const controller = new AbortController();
      const draft: DraftAttachment = {
        localId,
        filename: file.name,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        status: "UPLOADING",
      };

      uploadControllers.current.set(localId, controller);
      setAttachments((current) => [...current, draft]);
      void uploadAttachment(file, {
        signal: controller.signal,
        onProgress: ({ percentage }) =>
          updateAttachment(localId, { progress: percentage }),
      })
        .then((attachment) => {
          updateAttachment(localId, {
            attachmentId: attachment.id,
            progress: 100,
            status: "READY",
          });
        })
        .catch((uploadError: unknown) => {
          if (controller.signal.aborted) return;
          updateAttachment(localId, {
            error:
              uploadError instanceof Error
                ? uploadError.message
                : "Image upload failed.",
            status: "FAILED",
          });
        })
        .finally(() => uploadControllers.current.delete(localId));
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
    setAttachmentMenuOpen(false);
  };

  const updateAttachment = (localId: string, patch: Partial<DraftAttachment>) =>
    setAttachments((current) =>
      current.map((attachment) =>
        attachment.localId === localId
          ? { ...attachment, ...patch }
          : attachment,
      ),
    );

  const removeAttachment = (localId: string) => {
    uploadControllers.current.get(localId)?.abort();
    uploadControllers.current.delete(localId);
    setAttachments((current) => {
      const target = current.find(
        (attachment) => attachment.localId === localId,
      );
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((attachment) => attachment.localId !== localId);
    });
  };

  const clearAttachments = () => {
    for (const attachment of attachments) {
      URL.revokeObjectURL(attachment.previewUrl);
    }
    setAttachments([]);
  };

  return (
    <div
      className={
        isNewTask
          ? "relative mx-auto w-full max-w-[1100px]"
          : "shrink-0 bg-gradient-to-t from-[#fafafa] via-[#fafafa] to-transparent px-4 pt-5 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-8 md:pb-5"
      }
    >
      {attachments.length > 0 ? (
        <AttachmentTray
          attachments={attachments}
          onRemove={removeAttachment}
          compact={!isNewTask}
        />
      ) : null}
      <form
        className={`relative mx-auto flex border border-[#c8c8c5] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition focus-within:border-[#8d8d89] ${
          isNewTask
            ? "min-h-[156px] w-full flex-col rounded-[30px] px-6 py-5"
            : "max-w-[1040px] items-end gap-3 rounded-[28px] px-4 py-3"
        }`}
        aria-busy={isSending || isStopping}
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <label className="sr-only" htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          rows={isNewTask ? 3 : 1}
          maxLength={MAX_MESSAGE_LENGTH + 1}
          disabled={isRunActive}
          placeholder={
            isNewTask ? "Assign a task or ask anything..." : "Send a message..."
          }
          className={`resize-none bg-transparent outline-none placeholder:text-[#a6a6a2] disabled:cursor-not-allowed disabled:opacity-60 ${
            isNewTask
              ? "min-h-[78px] w-full text-[17px] leading-7"
              : "max-h-40 min-h-10 flex-1 px-1 py-2 text-[15px]"
          }`}
        />

        <div
          className={
            isNewTask ? "mt-auto flex items-center justify-between" : "contents"
          }
        >
          <div
            className={`items-center gap-1 ${isNewTask ? "flex" : "hidden"}`}
          >
            <button
              type="button"
              aria-label="Add attachment"
              aria-expanded={attachmentMenuOpen}
              disabled={attachments.length >= 10}
              onClick={() => setAttachmentMenuOpen((open) => !open)}
              className="grid size-9 place-items-center rounded-full text-[#5f5f5b] transition hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-35"
            >
              <LineIcon name="paperclip" className="size-[19px]" />
            </button>
            <button
              type="button"
              aria-label="Connect tools"
              className="grid size-9 place-items-center rounded-full text-[#5f5f5b] transition hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            >
              <LineIcon name="plug" className="size-[19px]" />
            </button>
          </div>

          <div
            className={`items-center ${isNewTask ? "flex gap-2" : "contents"}`}
          >
            {isNewTask ? (
              <button
                type="button"
                aria-label="Voice input"
                className="grid size-9 place-items-center rounded-full text-[#5f5f5b] transition hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
              >
                <LineIcon name="mic" className="size-[19px]" />
              </button>
            ) : (
              <button
                type="button"
                aria-label="Add attachment"
                onClick={() => fileInputRef.current?.click()}
                disabled={isRunActive || attachments.length >= 10}
                className="grid size-10 shrink-0 place-items-center rounded-xl text-black/25 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <LineIcon name="plus" className="size-5" />
              </button>
            )}

            {isRunActive ? (
              <button
                type="button"
                aria-label={isStopping ? "Stopping run" : "Stop run"}
                disabled={isStopping}
                onClick={() => void onStop().catch(() => undefined)}
                className="grid size-11 shrink-0 place-items-center rounded-[15px] bg-[#f2070d] text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-wait disabled:bg-red-300"
              >
                <span
                  aria-hidden="true"
                  className="size-3 rounded-[2px] bg-white"
                />
              </button>
            ) : (
              <button
                type="submit"
                aria-label={isSending ? "Sending message" : "Send message"}
                disabled={!canSend}
                className={`grid shrink-0 place-items-center rounded-full bg-[#232320] text-white transition hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:bg-[#efefed] disabled:text-[#aaa9a5] ${isNewTask ? "size-10" : "size-11"}`}
              >
                {isSending ? (
                  <span
                    aria-hidden="true"
                    className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                  />
                ) : (
                  <LineIcon name="arrow-up" className="size-[19px]" />
                )}
              </button>
            )}
          </div>
        </div>

        {isNewTask && attachmentMenuOpen ? (
          <div className="absolute top-[calc(100%+10px)] left-0 z-20 w-[440px] max-w-[calc(100vw-2rem)] rounded-2xl border border-black/10 bg-white p-4 shadow-[0_16px_45px_rgba(0,0,0,0.14)]">
            <p className="text-[13px] leading-5 text-[#656560]">
              Add a file from your device or select one from your library
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-[13px] font-medium text-[#363632] hover:bg-black/[0.025]"
              >
                <LineIcon name="grid" className="size-4" />
                Select Asset
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#252522] px-3 text-[13px] font-medium text-white hover:bg-black"
              >
                <LineIcon name="plus" className="size-4" />
                Upload
              </button>
            </div>
          </div>
        ) : null}
      </form>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        onChange={(event) => addFiles(event.target.files)}
        className="hidden"
        aria-label="Upload image"
      />

      {!isNewTask ? (
        <div className="mx-auto mt-2 flex max-w-[1040px] items-start justify-between gap-3 px-1 text-[11px]">
          <p className={error ? "text-red-700" : "text-black/35"}>
            {error
              ? error.message
              : "Agent responses can be inaccurate. Verify important results."}
          </p>
          {message.length > 15_000 ? (
            <CharacterCount value={message.length} />
          ) : null}
        </div>
      ) : error ? (
        <p className="mt-3 px-2 text-[12px] text-red-700">{error.message}</p>
      ) : message.length > 15_000 ? (
        <div className="mt-2 text-right">
          <CharacterCount value={message.length} />
        </div>
      ) : null}
    </div>
  );
}

function AttachmentTray({
  attachments,
  onRemove,
  compact,
}: {
  attachments: DraftAttachment[];
  onRemove: (localId: string) => void;
  compact: boolean;
}) {
  const firstFailure = attachments.find(
    (attachment) => attachment.status === "FAILED",
  );

  return (
    <div
      className={`mx-auto mb-2 w-full ${compact ? "max-w-[1040px]" : "max-w-[1100px]"}`}
      aria-label="Attached images"
    >
      <div className="flex gap-2 overflow-x-auto pb-1">
        {attachments.map((attachment) => (
          <div
            key={attachment.localId}
            className="relative size-[76px] shrink-0 overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm"
          >
            {/* Blob preview is browser-owned and not suitable for next/image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachment.previewUrl}
              alt={attachment.filename}
              className="size-full object-cover"
            />
            {attachment.status === "UPLOADING" ? (
              <div className="absolute inset-0 grid place-items-center bg-black/45 text-[11px] font-medium text-white">
                {attachment.progress}%
              </div>
            ) : null}
            {attachment.status === "FAILED" ? (
              <div
                title={attachment.error}
                className="absolute inset-0 grid place-items-center bg-red-700/80 px-1 text-center text-[10px] leading-3 text-white"
              >
                Upload failed
              </div>
            ) : null}
            <button
              type="button"
              aria-label={`Remove ${attachment.filename}`}
              onClick={() => onRemove(attachment.localId)}
              className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-black/65 text-[12px] text-white hover:bg-black"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {firstFailure?.error ? (
        <p role="alert" className="mt-1 text-[11px] text-red-700">
          {firstFailure.error}
        </p>
      ) : null}
    </div>
  );
}

function CharacterCount({ value }: { value: number }) {
  return (
    <span
      className={value > MAX_MESSAGE_LENGTH ? "text-red-700" : "text-black/35"}
    >
      {value.toLocaleString()}/{MAX_MESSAGE_LENGTH.toLocaleString()}
    </span>
  );
}
