import { describe, expect, it, vi } from "vitest";

import { listCreditLedger } from "@/lib/api/credits";
import { createApiClient } from "@/lib/api/client";
import { getRunWaitpoint, resolveWaitpoint } from "@/lib/api/waitpoints";

describe("Phase 2 API clients", () => {
  it("forwards the opaque ledger cursor", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        Response.json({ items: [], nextCursor: null, hasMore: false }),
      );
    const client = createApiClient({
      baseUrl: "http://localhost:3001/",
      getToken: async () => "token",
      fetchImpl,
    });

    await listCreditLedger(client, "opaque+/cursor=");

    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain(
      "cursor=opaque%2B%2Fcursor%3D",
    );
  });

  it("treats a missing run waitpoint as no plan", async () => {
    const client = createApiClient({
      baseUrl: "http://localhost:3001/",
      getToken: async () => "token",
      fetchImpl: vi.fn().mockResolvedValue(
        Response.json(
          {
            error: "Not found",
            message: "Not found",
            code: "NOT_FOUND",
            traceId: "trace-1",
          },
          { status: 404 },
        ),
      ),
    });

    await expect(getRunWaitpoint(client, "run-1")).resolves.toBeNull();
  });

  it("sends the same resolve key in body and idempotency header", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      Response.json({
        waitpointId: "waitpoint-1",
        runId: "run-1",
        status: "RESOLVED",
        resolution: "RUN_ALL",
        applied: true,
      }),
    );
    const client = createApiClient({
      baseUrl: "http://localhost:3001/",
      getToken: async () => "token",
      fetchImpl,
    });

    await resolveWaitpoint(client, "waitpoint-1", {
      resolution: "RUN_ALL",
      idempotencyKey: "approval-key-1",
    });

    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(init.headers).get("Idempotency-Key")).toBe(
      "approval-key-1",
    );
    expect(JSON.parse(String(init.body))).toEqual({
      resolution: "RUN_ALL",
      idempotencyKey: "approval-key-1",
    });
  });
});
