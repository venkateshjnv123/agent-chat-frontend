/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Source of truth: agent-chat-backend/src/contracts/
 * Regenerate with `pnpm contracts:sync` in the backend repo.
 * CI runs `pnpm contracts:check`, which fails if this file is stale.
 */

import { z } from "zod";

export const ServiceResponseSchema = z.object({
  service: z.literal("agent-chat-backend"),
  status: z.literal("ok"),
  version: z.literal("v1"),
});

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  timestamp: z.iso.datetime(),
});

export type ServiceResponse = z.infer<typeof ServiceResponseSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
