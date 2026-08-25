import Uppy from "@uppy/core";
import Transloadit from "@uppy/transloadit";

import {
  ACCEPTED_MIME_TYPES,
  AttachmentSchema,
  CompleteUploadRequestSchema,
  MAX_ATTACHMENT_BYTES,
  SignUploadRequestSchema,
  SignUploadResponseSchema,
  type Attachment,
} from "@/contracts/generated";

import type { ApiClient } from "./client";

const MAX_COMPLETION_POLLS = 45;
const COMPLETION_POLL_MS = 2_000;

export type UploadProgress = {
  uploaded: number;
  total: number;
  percentage: number;
};

export function signAttachment(
  client: ApiClient,
  input: {
    chatId?: string;
    file: File;
  },
  signal?: AbortSignal,
) {
  const request = SignUploadRequestSchema.parse({
    ...(input.chatId ? { chatId: input.chatId } : {}),
    filename: input.file.name,
    mimeType: input.file.type,
    fileSize: input.file.size,
  });

  return client.request("api/v1/attachments", SignUploadResponseSchema, {
    method: "POST",
    body: JSON.stringify(request),
    signal,
  });
}

export function completeAttachment(
  client: ApiClient,
  attachmentId: string,
  assemblyId: string,
  signal?: AbortSignal,
) {
  const request = CompleteUploadRequestSchema.parse({ assemblyId });

  return client.request(
    `api/v1/attachments/${encodeURIComponent(attachmentId)}/complete`,
    AttachmentSchema,
    {
      method: "POST",
      body: JSON.stringify(request),
      signal,
    },
  );
}

/**
 * One file per Assembly. Backend signature identifies one attachment row, so
 * batching unrelated files under one Assembly would lose ownership/order.
 */
export async function uploadAttachmentFile(
  client: ApiClient,
  input: {
    chatId?: string;
    file: File;
    signal?: AbortSignal;
    onProgress?: (progress: UploadProgress) => void;
  },
): Promise<Attachment> {
  validateFile(input.file);
  const signed = await signAttachment(client, input, input.signal);
  let assemblyId: string | null = null;
  const uppy = new Uppy({
    autoProceed: false,
    allowMultipleUploadBatches: false,
    restrictions: {
      allowedFileTypes: [...ACCEPTED_MIME_TYPES],
      maxFileSize: MAX_ATTACHMENT_BYTES,
      maxNumberOfFiles: 1,
    },
  });

  uppy.use(Transloadit, {
    service: new URL(signed.uploadUrl).origin,
    assemblyOptions: {
      // Signed bytes must remain exact. Never JSON.parse/stringify this value.
      params: signed.params,
      signature: signed.signature,
    },
    waitForEncoding: false,
    retryDelays: [0, 1_000, 3_000],
  });
  uppy.on("transloadit:assembly-created", (assembly) => {
    assemblyId = assembly.assembly_id ?? null;
  });
  uppy.on("upload-progress", (_file, progress) => {
    if (!progress.bytesTotal) return;
    input.onProgress?.({
      uploaded: progress.bytesUploaded,
      total: progress.bytesTotal,
      percentage: Math.min(
        100,
        Math.round((progress.bytesUploaded / progress.bytesTotal) * 100),
      ),
    });
  });

  const abort = () => uppy.cancelAll();
  input.signal?.addEventListener("abort", abort, { once: true });

  try {
    uppy.addFile({
      name: input.file.name,
      type: input.file.type,
      data: input.file,
      source: "magica-composer",
    });
    const result = await uppy.upload();

    if (result?.failed?.length) {
      throw result.failed[0]?.error ?? new Error("Upload failed.");
    }

    assemblyId ??=
      uppy.getPlugin("Transloadit")?.getAssembly()?.assembly_id ?? null;

    if (!assemblyId) {
      throw new Error("Upload service did not return an Assembly id.");
    }

    return await pollUntilTerminal(
      client,
      signed.attachmentId,
      assemblyId,
      input.signal,
    );
  } finally {
    input.signal?.removeEventListener("abort", abort);
    uppy.destroy();
  }
}

function validateFile(file: File) {
  if (!(ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type)) {
    throw new Error("Use a PNG, JPEG, WebP, or GIF image.");
  }

  if (file.size <= 0 || file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error("Image must be smaller than 10 MB.");
  }
}

async function pollUntilTerminal(
  client: ApiClient,
  attachmentId: string,
  assemblyId: string,
  signal?: AbortSignal,
) {
  for (let attempt = 0; attempt < MAX_COMPLETION_POLLS; attempt += 1) {
    const attachment = await completeAttachment(
      client,
      attachmentId,
      assemblyId,
      signal,
    );

    if (attachment.status === "READY") return attachment;
    if (attachment.status === "FAILED") {
      throw new Error(attachment.userMessage ?? "That image could not upload.");
    }

    await delay(COMPLETION_POLL_MS, signal);
  }

  throw new Error("Upload verification timed out. Try again.");
}

function delay(milliseconds: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
      return;
    }

    const abort = () => {
      window.clearTimeout(timeout);
      reject(signal?.reason ?? new DOMException("Aborted", "AbortError"));
    };
    const timeout = window.setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, milliseconds);
    signal?.addEventListener("abort", abort, { once: true });
  });
}
