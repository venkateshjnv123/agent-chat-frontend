import type { Metadata } from "next";
import "./globals.css";

import { AppProviders } from "./providers";

export const metadata: Metadata = {
  title: "Galaxy Agent Chat",
  description: "Durable agent chat with recoverable tool runs",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
