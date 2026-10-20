FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- production image ----
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
# npm is removed once it has installed the production tree. The runtime only ever runs
# `node dist/index.js`, so npm is dead weight at best - and the npm bundled in
# node:22-alpine ships its own vendored copies of sigstore and picomatch that carry
# HIGH-severity CVEs (CVE-2026-48815, CVE-2026-33671). Those are reported against the
# image even though nothing in our dependency tree uses them, which blocks the release
# gate's Trivy scan on vulnerabilities that are not reachable from our code.
# Deleting the lock file too keeps Trivy scanning the installed tree rather than the
# full lock file, so dev-only dependencies are no longer reported against production.
RUN npm ci --omit=dev --ignore-scripts \
    && npm cache clean --force \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
    && rm -f package-lock.json

COPY --from=builder /app/dist ./dist
COPY drizzle ./drizzle
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh && chown -R node:node /app

USER node

EXPOSE 8080

CMD ["./entrypoint.sh"]
