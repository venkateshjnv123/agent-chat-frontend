# Galaxy Agent Chat Frontend

Responsive web client for durable AI-agent and media-tool runs. It combines authenticated chat, streamed assistant activity, plan approvals, media uploads, credit history, run cancellation, failure recovery, and task navigation in one Next.js application.

## What it does

- Protects application routes with Clerk and obtains a fresh bearer token for each backend request.
- Creates chats from the first message without leaving empty chats after failed sends.
- Renders persisted messages, streamed assistant text, agent activity, tool cards, attachments, failures, and approval plans.
- Recovers active runs after reloads and falls back to REST polling when realtime delivery is unavailable.
- Supports stop, retry, run-all, step-by-step, and request-changes interactions.
- Uploads supported images, videos, and audio directly to Transloadit through backend-signed assemblies; ordered video attachments can be sent directly to the merge-video tool.
- Displays available credits and a cursor-paginated credit ledger.
- Provides responsive chat, task-list, usage, sign-in, and sign-up routes.

## Stack

- Next.js App Router, React, and strict TypeScript
- Clerk authentication
- TanStack Query for server state
- Zustand for short-lived realtime and active-run state
- Trigger.dev React hooks for realtime streams
- Zod for environment and response validation
- Uppy and Transloadit for direct uploads
- Tailwind CSS
- Vitest and Testing Library
- Playwright configuration for browser tests

## Architecture overview

```text
Next.js protected route
  -> Clerk provider and short-lived session token
  -> page-level client component
  -> TanStack Query hook or mutation
  -> centralized typed API client
  -> authenticated backend API

Trigger.dev Realtime
  -> validate text, activity, and metadata events
  -> ephemeral Zustand stream snapshot
  -> merge with persisted TanStack Query messages by stable IDs
  -> REST reconciliation on reload, reconnect, expiry, and completion
```

### State ownership

| State                    | Owner                         | Examples                                                        |
| ------------------------ | ----------------------------- | --------------------------------------------------------------- |
| Durable server state     | TanStack Query                | Chats, messages, run status, waitpoints, credits, ledger pages. |
| In-flight stream state   | Zustand                       | Assistant text deltas, activity steps, active run handle.       |
| Local presentation state | React component state         | Composer text, selected files, mobile sidebar, task selection.  |
| Wire contracts           | Backend-generated Zod schemas | API responses, realtime events, run metadata, tool payloads.    |

### Send and recovery lifecycle

1. The composer validates local limits, uploads selected media in display order, and sends one request with a stable idempotency key.
2. The backend returns chat, message, run, and realtime identifiers. A first send replaces the URL with the newly created chat route.
3. `useRunMonitor` subscribes to run-scoped text and activity streams. Every incoming payload is checked against generated Zod contracts before rendering.
4. Stream snapshots remain ephemeral. Persisted messages remain authoritative and are invalidated after terminal events.
5. Realtime token expiry triggers a bounded refresh. Subscription failure degrades to REST run and message polling.
6. Completion, failure, or cancellation reconciles chats, messages, run state, credits, and ledger data before clearing the stream buffer.

## Setup instructions

### Prerequisites

- Node.js 20 or newer
- pnpm
- Clerk application and credentials
- Running Galaxy Agent Chat backend
- Running Trigger.dev worker for complete chat execution

### Install and configure

```bash
pnpm install
cp .env.example .env.local
```

Fill the Clerk values and point `NEXT_PUBLIC_API_BASE_URL` at the backend. For local development, the default backend URL is `http://localhost:3001`.

Start the frontend:

```bash
pnpm dev
```

Open `http://localhost:3000`.

Complete local chat requires three processes:

1. Frontend on port `3000`.
2. Backend on port `3001`.
3. Trigger.dev worker from the backend repository.

If the worker is missing, message submission can succeed while no assistant response arrives.

This machine may use a TLS-intercepting proxy. Repository development and build scripts already run Next.js with the system CA.

## Environment variables

| Variable                                          | Visibility  | Purpose                                                  |
| ------------------------------------------------- | ----------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`               | Browser     | Clerk publishable key.                                   |
| `CLERK_SECRET_KEY`                                | Server only | Clerk secret used by Next.js server-side authentication. |
| `NEXT_PUBLIC_API_BASE_URL`                        | Browser     | Backend origin, such as `http://localhost:3001`.         |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`                   | Browser     | Sign-in route; defaults to `/sign-in` in the example.    |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL`                   | Browser     | Sign-up route; defaults to `/sign-up` in the example.    |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Browser     | Redirect after sign-in.                                  |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Browser     | Redirect after sign-up.                                  |

Never place secrets in `NEXT_PUBLIC_*` variables. Those values are bundled for the browser by design.

## Routes

| Route           | Access        | Purpose                                 |
| --------------- | ------------- | --------------------------------------- |
| `/`             | Public        | Redirects to `/chat`.                   |
| `/sign-in`      | Public        | Clerk sign-in flow.                     |
| `/sign-up`      | Public        | Clerk sign-up flow.                     |
| `/chat`         | Authenticated | Start a new task.                       |
| `/chat/:chatId` | Authenticated | View and continue one conversation.     |
| `/tasks`        | Authenticated | Search and browse task history.         |
| `/usage`        | Authenticated | View balance and credit-ledger history. |

Protected routes call `auth.protect()` in the application layout. The protected application provides a loading state, while dynamic chat routes provide explicit error and not-found states.

## Contracts and API access

`src/lib/api` is the only first-party HTTP boundary. It resolves a Clerk token for each request, attaches optional idempotency keys, parses safe error details and trace IDs, and validates successful responses.

Generated contracts live in `src/contracts/generated` and must never be edited by hand. Synchronize them from the backend repository:

```bash
cd ../agent-chat-backend
pnpm contracts:sync
pnpm contracts:check
```

## Verification

Run the local quality gate before handoff:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
git diff --check
```

Run a focused test during development:

```bash
pnpm exec vitest run tests/components/ChatShell.test.tsx
```

Playwright is configured, but browser smoke specifications still need to be added before `pnpm test:e2e` becomes a required gate. Install its browser runtime with:

```bash
pnpm exec playwright install chromium
```

## What I would improve with more time

1. Increate visual fidelity par to the magica website
2. Voice section can be improved
3. Currently message window and context are not scalable and paginated well enough for longer chats this will be problem.
4. Media attachments and photo, video viewer and generator can be upgraded.
5. Tools as separate entities for better usage.
6. realtime token visualization in the chats.

## Repository layout

```text
src/app/                  App Router pages, layouts, and route states
src/components/chat/      chat shell, composer, messages, tools, sidebar
src/components/approval/  persisted plan and waitpoint interactions
src/components/credits/   balance and ledger UI
src/components/tasks/     task-history UI
src/components/routes/    reusable loading, error, and empty states
src/components/ui/        shared icons and presentation primitives
src/lib/api/              authenticated, validated backend client
src/lib/realtime/         Trigger.dev subscription and REST recovery
src/queries/              TanStack Query hooks and keys
src/stores/               ephemeral active-run and stream buffers
src/contracts/generated/  backend-owned synchronized contracts
tests/                    component, query, API, realtime, and utility tests
```

See [AGENTS.md](./AGENTS.md) for repository constraints and required UI states.
