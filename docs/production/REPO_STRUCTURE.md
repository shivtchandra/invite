# Production Repo Structure

This is the recommended migration target for a production build on Vercel.

```text
invite/
  apps/
    web/                         # Next.js app router frontend + route handlers
      src/
        app/
          (marketing)/page.tsx
          dashboard/page.tsx
          i/[slug]/page.tsx      # public invite page
          api/
            invites/route.ts     # POST create, GET list
            invites/[slug]/route.ts
            invites/[slug]/respond/route.ts
            parse-booking/route.ts
            enrich/route.ts
            og/[slug]/route.tsx  # dynamic OG image
        components/
        lib/
          auth/
          db/
          cache/
          validation/
          telemetry/
      next.config.mjs
      package.json
  packages/
    db/                          # Prisma/Drizzle schema + migrations
      migrations/
      schema.prisma
      seed.ts
    shared/                      # zod schemas + DTOs
      src/
        invite.ts
        parsing.ts
        api.ts
    worker/                      # async enrichment worker
      src/
        jobs/
          enrichInvite.ts
        index.ts
  infra/
    vercel/
      vercel.json
    docker/
      docker-compose.dev.yml
  docs/
    production/
      REPO_STRUCTURE.md
      ARCHITECTURE.md
      API_CONTRACT.md
      DELIVERY_PLAN.md
  db/
    schema.sql                   # raw SQL schema (if not using Prisma migrations)
```

## Why This Shape

- `apps/web`: one deployable unit for Vercel, easiest SSR + OG + API coupling.
- `packages/shared`: prevents drift between frontend forms and backend contracts.
- `packages/worker`: moves unreliable enrich tasks off request/response path.
- `packages/db`: explicit versioned schema + repeatable migrations.

