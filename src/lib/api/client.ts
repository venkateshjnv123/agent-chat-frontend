import type { ZodType } from "zod";

import { readPublicEnv } from "@/env/public";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiRequestOptions = RequestInit & {
  token?: string | null;
};

export async function apiRequest<T>(
  path: string,
  schema: ZodType<T>,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { NEXT_PUBLIC_API_BASE_URL } = readPublicEnv();
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);

  const response = await fetch(new URL(path, NEXT_PUBLIC_API_BASE_URL), {
    ...options,
    headers,
  });
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      `API request failed with ${response.status}`,
      response.status,
      body,
    );
  }

  return schema.parse(body);
}
