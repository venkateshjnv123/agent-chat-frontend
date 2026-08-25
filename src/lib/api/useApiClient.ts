"use client";

import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";

import { createApiClient } from "./client";

/** One client per active Clerk token provider; each request resolves a fresh token. */
export function useApiClient() {
  const { getToken } = useAuth();

  return useMemo(() => createApiClient({ getToken }), [getToken]);
}
