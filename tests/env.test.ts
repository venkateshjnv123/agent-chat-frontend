import { describe, expect, it } from "vitest";

import { readPublicEnv } from "@/env/public";

describe("readPublicEnv", () => {
  it("accepts public frontend configuration", () => {
    expect(
      readPublicEnv({
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
        NEXT_PUBLIC_API_BASE_URL: "https://api.example.test",
      }),
    ).toMatchObject({ NEXT_PUBLIC_API_BASE_URL: "https://api.example.test" });
  });

  it("reports invalid field names", () => {
    expect(() => readPublicEnv({})).toThrow(
      "Invalid public environment: NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    );
  });
});
