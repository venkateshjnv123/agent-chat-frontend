import {
  CreditBalanceSchema,
  LedgerListResponseSchema,
} from "@/contracts/generated";

import type { ApiClient } from "./client";

export function getCredits(client: ApiClient, signal?: AbortSignal) {
  return client.request("api/v1/credits", CreditBalanceSchema, { signal });
}

export function listCreditLedger(
  client: ApiClient,
  cursor: string | null,
  signal?: AbortSignal,
) {
  const search = new URLSearchParams({ limit: "50" });

  if (cursor) search.set("cursor", cursor);

  return client.request(
    `api/v1/credits/ledger?${search.toString()}`,
    LedgerListResponseSchema,
    { signal },
  );
}
