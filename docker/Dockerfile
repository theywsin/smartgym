# SmartGym 2.0 production images (one Dockerfile, three targets):
#   web     Next.js standalone server (port 3000)
#   tools   worker + database migrations/seed (same code, full dependencies)
# Build: docker build -f docker/Dockerfile --target web -t smartgym-web .
FROM node:22-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/worker/package.json apps/worker/
COPY packages/shared/package.json packages/shared/
COPY packages/validation/package.json packages/validation/
COPY packages/core/package.json packages/core/
COPY packages/db/package.json packages/db/
COPY packages/db/prisma packages/db/prisma
COPY packages/db/prisma.config.ts packages/db/
# Optional build secret "ca" lets builds behind a TLS-intercepting proxy reach the npm registry.
RUN --mount=type=secret,id=ca,required=false \
    if [ -f /run/secrets/ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/ca; fi; \
    npm ci --no-audit --no-fund

FROM deps AS build
COPY . .
RUN npm run generate -w @smartgym/db && npm run build -w @smartgym/web

# ── web ──────────────────────────────────────────────
FROM base AS web
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]

# ── worker / migrate / seed ──────────────────────────
FROM base AS tools
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app /app
USER node
CMD ["npm", "start", "-w", "@smartgym/worker"]
