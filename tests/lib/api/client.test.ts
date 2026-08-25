import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { ApiError, createApiClient } from "@/lib/api/client";

const ResultSchema = z.object({ ok: z.literal(true) });

describe("createApiClient", () => {
  it("gets a fresh Clerk token for every authenticated request", async () => {
    const getToken = vi
      .fn<() => Promise<string | null>>()
      .mockResolvedValueOnce("token-1")
      .mockResolvedValueOnce("token-2");
    const fetchImpl = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        const authorization = new Headers(init?.headers).get("Authorization");

        return Response.json({ ok: true, authorization });
      },
    );
    const schema = z.object({ ok: z.literal(true), authorization: z.string() });
    const client = createApiClient({
      getToken,
      baseUrl: "https://api.example.test/api/",
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(client.request("v1/health", schema)).resolves.toMatchObject({
      authorization: "Bearer token-1",
    });
    await expect(client.request("v1/health", schema)).resolves.toMatchObject({
      authorization: "Bearer token-2",
    });
    expect(getToken).toHaveBeenCalledTimes(2);
  });

  it("forwards abort and idempotency controls", async () => {
    const controller = new AbortController();
    const fetchImpl = vi.fn(async (...request: Parameters<typeof fetch>) => {
      void request;
      return Response.json({ ok: true });
    });
    const client = createApiClient({
      getToken: async () => "token",
      baseUrl: "https://api.example.test/api/",
      fetchImpl: fetchImpl as typeof fetch,
    });

    await client.request("v1/messages", ResultSchema, {
      method: "POST",
      body: JSON.stringify({ content: "hello" }),
      signal: controller.signal,
      idempotencyKey: "logical-send-1",
    });

    const [, init] = fetchImpl.mock.calls[0] ?? [];
    const headers = new Headers(init?.headers);

    expect(init?.signal).toBe(controller.signal);
    expect(headers.get("Idempotency-Key")).toBe("logical-send-1");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("keeps server message, code and trace id on HTTP errors", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json(
        {
          error: "active_run",
          message: "A run is already active.",
          code: "CONFLICT",
          traceId: "trace-1",
        },
        { status: 409 },
      ),
    );
    const client = createApiClient({
      getToken: async () => "token",
      baseUrl: "https://api.example.test",
      fetchImpl: fetchImpl as typeof fetch,
    });

    const request = client.request("api/v1/messages", ResultSchema);

    await expect(request).rejects.toMatchObject({
      message: "A run is already active.",
      status: 409,
      code: "CONFLICT",
      traceId: "trace-1",
    } satisfies Partial<ApiError>);
  });

  it("fails before fetch when authenticated request has no session token", async () => {
    const fetchImpl = vi.fn();
    const client = createApiClient({
      getToken: async () => null,
      baseUrl: "https://api.example.test",
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(
      client.request("api/v1/messages", ResultSchema),
    ).rejects.toMatchObject({ status: 401, code: "UNAUTHORIZED" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
