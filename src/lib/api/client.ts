import type { ZodType } from "zod";

import { readPublicEnv } from "@/env/public";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
    readonly traceId: string | null,
    readonly code: string | null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ApiContractError extends Error {
  constructor(
    readonly path: string,
    readonly cause: unknown,
  ) {
    super(`API response did not match its contract: ${path}`);
    this.name = "ApiContractError";
  }
}

export type TokenProvider = () => Promise<string | null>;

export type ApiRequestOptions = RequestInit & {
  /** Added as a header; state-changing request bodies still carry their contract field. */
  idempotencyKey?: string;
  /** Public endpoints may opt out. App endpoints authenticate by default. */
  authenticated?: boolean;
};

type CreateApiClientOptions = {
  getToken: TokenProvider;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

export function createApiClient({
  getToken,
  baseUrl,
  fetchImpl = fetch,
}: CreateApiClientOptions) {
  return {
    async request<T>(
      path: string,
      schema: ZodType<T>,
      options: ApiRequestOptions = {},
    ): Promise<T> {
      const resolvedBaseUrl =
        baseUrl ?? readPublicEnv().NEXT_PUBLIC_API_BASE_URL;
      const {
        authenticated = true,
        idempotencyKey,
        headers: suppliedHeaders,
        ...requestInit
      } = options;
      const headers = new Headers(suppliedHeaders);

      headers.set("Accept", "application/json");
      if (requestInit.body) headers.set("Content-Type", "application/json");
      if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey);

      if (authenticated) {
        // Clerk tokens are short lived. Resolve one for every request; never cache it.
        const token = await getToken();

        if (!token) {
          throw new ApiError(
            "Authentication required",
            401,
            null,
            null,
            "UNAUTHORIZED",
          );
        }

        headers.set("Authorization", `Bearer ${token}`);
      }

      const response = await fetchImpl(resolveUrl(resolvedBaseUrl, path), {
        ...requestInit,
        headers,
      });
      const body = await readResponseBody(response);
      const traceId =
        readString(body, "traceId") ?? response.headers.get("x-trace-id");

      if (!response.ok) {
        throw new ApiError(
          readString(body, "message") ??
            `API request failed with ${response.status}`,
          response.status,
          body,
          traceId,
          readString(body, "code"),
        );
      }

      const parsed = schema.safeParse(body);

      if (!parsed.success) {
        throw new ApiContractError(path, parsed.error);
      }

      return parsed.data;
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

function resolveUrl(baseUrl: string, path: string): URL {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

  return new URL(normalizedPath, normalizedBase);
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }

  const text = await response.text();

  return text.length > 0 ? text : null;
}

function readString(value: unknown, key: string): string | null {
  if (typeof value !== "object" || value === null) return null;

  const candidate = Reflect.get(value, key);

  return typeof candidate === "string" ? candidate : null;
}
