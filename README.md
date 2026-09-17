# ContextOS

ContextOS is a multi-tenant AI knowledge workspace. It supports session-authenticated workspaces, tenant-scoped knowledge bases, document ingestion, and grounded chat when an OpenAI-compatible provider is configured.

## Stack

- pnpm workspaces and Turborepo
- Next.js App Router, TypeScript, Tailwind CSS, TanStack Query-ready web app
- NestJS API with validated environment configuration
- PostgreSQL/Prisma, with a pgvector-ready `DocumentChunk.embedding` field
- Redis-backed BullMQ ingestion worker, PDF/TXT/Markdown extraction, deterministic chunking, and pgvector-ready retrieval

## Architecture

`apps/web` owns the customer-facing interface. `apps/api` owns HTTP APIs, configuration, and persistence boundaries. `packages/types`, `packages/ui`, and `packages/config` hold small shared contracts. Every domain record with workspace scope is anchored to `Workspace`; membership is modeled separately through `WorkspaceMember`.

See [docs/architecture.md](docs/architecture.md) for the data model and tenancy notes.

## Local setup

1. Copy `.env.example` to `.env`, and `apps/api/.env.example` to `apps/api/.env`.
2. Start infrastructure: `docker compose up -d`.
3. Install dependencies: `pnpm install`.
4. Generate Prisma client: `pnpm db:generate`.
5. Apply migrations: `pnpm --filter api prisma:migrate`.
6. Start applications: `pnpm dev` (web defaults to port 3000; API defaults to 4000).

The health endpoint is `GET http://localhost:4000/api/health`.

## Commands

`pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm format`, and `pnpm format:check` run from the repository root. `pnpm db:generate` generates Prisma Client.

## Implemented scope

Documents are limited to PDF, TXT, and Markdown, up to 10 MB. Upload persists a tenant-scoped document, then enqueues extraction and chunking. Redis unavailability results in a visible FAILED status rather than a false success. pgvector SQL is isolated in `VectorRepository`; embeddings and chat require `LLM_API_KEY` outside tests. Chat streams provider tokens and stores citations derived solely from retrieved chunks.

## Demo credentials

After manual migration and seed: `demo@contextos.dev` / `DemoPass123!`.

## Roadmap

1. Authentication and workspace authorization middleware.
2. Signed upload, document extraction, queueing, and chunking.
3. pgvector retrieval plus streamed, cited chat.
4. RBAC management, audit events, analytics, and AI cost reporting.

## Demo data note

The dashboard uses a clearly marked **Demo workspace** and contains no seeded customer records, usage figures, testimonials, activity feeds, or claims. It is visual scaffolding only.
