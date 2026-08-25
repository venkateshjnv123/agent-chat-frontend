import { describe, expect, it, vi } from "vitest";

import { completeAttachment, signAttachment } from "@/lib/api/attachments";
import { createApiClient } from "@/lib/api/client";

describe("attachment API", () => {
  it("prepares a signed image upload without exposing provider secrets", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          attachmentId: "attachment-1",
          uploadUrl: "https://api2.transloadit.com/assemblies",
          params: '{"auth":{"key":"public-key"}}',
          signature: "sha384:signed",
          expiresAt: "2026-08-26T01:00:00.000Z",
        },
        201,
      ),
    );
    const client = createApiClient({
      baseUrl: "http://localhost:3001",
      fetchImpl,
      getToken: async () => "clerk-token",
    });
    const file = new File(["png"], "puppy.png", { type: "image/png" });

    await signAttachment(client, { chatId: "chat-1", file });

    const [url, init] = fetchImpl.mock.calls[0] as [URL, RequestInit];
    expect(url.pathname).toBe("/api/v1/attachments");
    expect(JSON.parse(String(init.body))).toEqual({
      chatId: "chat-1",
      filename: "puppy.png",
      mimeType: "image/png",
      fileSize: 3,
    });
    expect(new Headers(init.headers).get("Authorization")).toBe(
      "Bearer clerk-token",
    );
  });

  it("asks backend to verify Assembly status instead of trusting browser URL", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        id: "attachment-1",
        status: "READY",
        filename: "puppy.png",
        mimeType: "image/png",
        fileSize: 3,
        width: 100,
        height: 100,
        url: "https://verified.example.test/puppy.png",
        order: 0,
        createdAt: "2026-08-26T00:00:00.000Z",
        userMessage: null,
      }),
    );
    const client = createApiClient({
      baseUrl: "http://localhost:3001",
      fetchImpl,
      getToken: async () => "clerk-token",
    });

    const result = await completeAttachment(
      client,
      "attachment-1",
      "assembly-1",
    );

    expect(result.url).toBe("https://verified.example.test/puppy.png");
    const [url, init] = fetchImpl.mock.calls[0] as [URL, RequestInit];
    expect(url.pathname).toBe("/api/v1/attachments/attachment-1/complete");
    expect(JSON.parse(String(init.body))).toEqual({ assemblyId: "assembly-1" });
  });
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
