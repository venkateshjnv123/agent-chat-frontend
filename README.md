# Agent Chat Frontend

Responsive Galaxy-like chat client for durable agent and media-tool runs.

## Status

Foundation scaffold: Next.js App Router, strict TypeScript, responsive empty chat shell, TanStack Query provider, typed API boundary, ephemeral Zustand stream store, Vitest, and Playwright wiring. Clerk and backend behavior follow as bounded vertical slices.

## Local setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

Playwright is wired but smoke specs arrive with working backend flows:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

## Architecture rules

- Components never issue raw first-party fetches.
- `src/lib/api` attaches bearer tokens and validates responses.
- TanStack Query owns server state; Zustand holds ephemeral token buffers only.
- Backend owns Zod contracts; synchronized output lands in `src/contracts/generated`.
- Realtime updates upsert by stable IDs. REST reconciles initial load, reconnect, expiry, and terminal state.
- Client bundle contains no secrets.

See [AGENTS.md](./AGENTS.md) for implementation constraints.

## Planned repository shape

```text
src/app/                  routes and providers
src/components/chat/      shell, messages, composer
src/components/tools/     registry-driven tool cards
src/components/artifacts/ generated media display
src/components/uploads/   P0.5 image uploads
src/lib/api/              typed first-party API boundary
src/lib/realtime/         subscription and reconciliation
src/queries/              TanStack Query hooks
src/stores/               ephemeral UI/stream state
src/contracts/generated/  backend-owned generated contracts
tests/                    component/unit tests
e2e/                      exactly three smoke specs
```

## Environment

Copy `.env.example`; never commit values. `NEXT_PUBLIC_API_BASE_URL` targets separately deployed backend. `CLERK_SECRET_KEY` is server-only and must never appear in client modules.

## Declared cuts

Search/pin, advanced artifact interactions, audio/video upload UI, broad animation polish, and more than three Playwright smoke specs. Recovery, three real Magica tools, skills, visible failures, and fidelity remain protected.
