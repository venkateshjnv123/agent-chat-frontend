"use client";

import { useCallback } from "react";

import {
  uploadAttachmentFile,
  type UploadProgress,
} from "@/lib/api/attachments";
import { useApiClient } from "@/lib/api/useApiClient";

export function useAttachmentUploader(chatId?: string) {
  const client = useApiClient();

  return useCallback(
    (
      file: File,
      options: {
        signal?: AbortSignal;
        onProgress?: (progress: UploadProgress) => void;
      } = {},
    ) =>
      uploadAttachmentFile(client, {
        ...(chatId ? { chatId } : {}),
        file,
        ...options,
      }),
    [chatId, client],
  );
}
