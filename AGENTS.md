# Repository Rules

## Stack and commands

- Next.js App Router, strict TypeScript, pnpm, Clerk, TanStack Query, Zustand, Zod, Vitest, Playwright.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before handoff.
- Run `pnpm format:check` and `git diff --check` before commit.

## Non-negotiables

- Zero raw first-party `fetch` in components. Use `src/lib/api/*` and TanStack Query.
- TanStack Query owns server state. Zustand owns short-lived stream/UI state only.
- Contracts come from `src/contracts/generated`; never redefine or hand-edit them.
- Reconcile from REST on initial load, realtime reconnect, token expiry, and terminal event.
- Merge messages, blocks, runs, and tools by stable IDs. Never blind-append realtime rows.
- Hard reload during run must not create duplicate assistant or tool rows.
- Keep secrets out of client bundle. Client code receives only intentional `NEXT_PUBLIC_*` variables.
- Mirror input limits client-side, but backend remains authoritative.
- One bounded vertical slice per task. Avoid multi-concern changes.

## Required UI states

- Composer: send, stop, disabled, error, retry, stopping.
- Runs: queued, running, waiting, completed, failed, cancelled, stopping.
- Tool cards: pending, running, completed, failed, cancelled.
- Failed/cancelled turns remain visible and explainable.
