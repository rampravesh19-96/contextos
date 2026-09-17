# Architecture

## Repository boundaries

The web application is a presentation layer. The NestJS API is the sole persistence boundary and will own authentication, authorization, orchestration, and provider integrations. Shared packages only expose low-level types, design primitives, and static product configuration; business logic remains in the API.

## Tenancy model

`Workspace` is the tenant root. `WorkspaceMember` is the user-to-workspace join model with a role. `KnowledgeBase`, `Document`, `DocumentChunk`, `Conversation`, and `AiUsageEvent` each retain a direct `workspaceId`, making tenant filters explicit and indexable. API queries must always constrain by an authorized workspace ID; this is a required future authorization boundary, not a client-side convention.

Documents additionally reference their knowledge base. Chunks retain their document and workspace IDs, allowing retrieval filtering without an unsafe cross-tenant join.

## Vector readiness

PostgreSQL uses the pgvector image. Prisma represents `DocumentChunk.embedding` as `Unsupported("vector")` so Prisma Client can coexist with a native vector column. A future SQL migration will enable the `vector` extension, add the dimensioned column (for the chosen embedding provider), and add the appropriate ANN index. Retrieval code should issue parameterized raw queries, always filtered by `workspaceId` and relevant knowledge base/document constraints.

## Operational foundations

Environment values are validated at API startup. Docker Compose provides local PostgreSQL and Redis only; Redis is intentionally not wired into a queue until ingestion work exists. The API exposes a small health endpoint suitable for container/platform probes.
