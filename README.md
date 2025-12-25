# FlytTribe Monorepo (pnpm + Turbo)

Packages

- `apps/web` — Next.js App Router client
- `packages/api` — tRPC routers/types
- `packages/db` — Drizzle ORM schema + migrations
- `packages/ui` — shared UI kit (Tailwind/shadcn)
- `packages/worker` — BullMQ worker
- `infra/` — docker-compose for Postgres/Redis

Getting started

1. Install deps: `corepack enable && pnpm install`
2. Start infra: `docker compose -f infra/docker-compose.yml up -d`
3. Configure env: copy `.env.example` -> `.env` (and `apps/web/.env.example` -> `.env.local` if needed)
4. Prepare DB: `pnpm db:push`
5. Dev: `pnpm dev` (runs via Turbo)

Scripts (root)

- `pnpm lint` / `pnpm typecheck` / `pnpm test`
- `pnpm format:check`
- `pnpm db:generate|push|migrate|studio`
