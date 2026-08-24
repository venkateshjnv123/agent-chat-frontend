import { z } from "zod";

export const PublicEnvSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_API_BASE_URL: z.url(),
});

export type PublicEnv = z.infer<typeof PublicEnvSchema>;

export function readPublicEnv(
  source: Record<string, string | undefined> = {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
): PublicEnv {
  const result = PublicEnvSchema.safeParse(source);

  if (!result.success) {
    const fields = [
      ...new Set(result.error.issues.map((issue) => issue.path.join("."))),
    ].sort();

    throw new Error(`Invalid public environment: ${fields.join(", ")}`);
  }

  return result.data;
}
