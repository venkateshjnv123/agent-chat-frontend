import { auth } from "@clerk/nextjs/server";

export default async function ProtectedAppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await auth.protect();

  return children;
}
