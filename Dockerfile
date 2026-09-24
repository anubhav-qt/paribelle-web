# syntax=docker/dockerfile:1
#
# NEXT_PUBLIC_* values are inlined into the JS bundle by `next build`, and the
# rewrites in next.config.js are resolved at build time too. So they are build
# args, not runtime env: changing the API URL means building a new image.
#
#   docker build -t paribelle/web \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.paribelle.in \
#     --build-arg NEXT_PUBLIC_APP_URL=https://paribelle.in .
#
# Server-only secrets (GOOGLE_CLIENT_SECRET etc.) are read at request time and
# are passed to the running container instead, never baked in here.

# ---- deps ----
# Node 24 because it ships npm 11, the version that writes package-lock.json
# on the dev machine. npm 10's `npm ci` rejects this lockfile (an
# @swc/helpers peer range that npm 11 accepts), so the versions must match.
FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build ----
FROM node:24-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_STORE_VENDOR_ID=00000000-0000-0000-0000-000000000001
ARG NEXT_PUBLIC_LOOKBOOK_ENABLED=false
ARG NEXT_PUBLIC_GA_TRACKING_ID=
ARG NEXT_PUBLIC_RAZORPAY_KEY_ID=
# Only for a Vercel-style multi-zone. Self-hosted, the reverse proxy routes
# /pom to the OMS directly, so this normally stays empty.
ARG OMS_ORIGIN=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_STORE_VENDOR_ID=$NEXT_PUBLIC_STORE_VENDOR_ID \
    NEXT_PUBLIC_LOOKBOOK_ENABLED=$NEXT_PUBLIC_LOOKBOOK_ENABLED \
    NEXT_PUBLIC_GA_TRACKING_ID=$NEXT_PUBLIC_GA_TRACKING_ID \
    NEXT_PUBLIC_RAZORPAY_KEY_ID=$NEXT_PUBLIC_RAZORPAY_KEY_ID \
    OMS_ORIGIN=$OMS_ORIGIN

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runtime ----
FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN useradd --system --uid 10001 web

# standalone/ holds server.js plus only the node_modules the server imports
# (sharp included, for next/image). public/ and static/ are left out of it by
# design and copied alongside.
COPY --from=build --chown=web:web /app/.next/standalone ./
COPY --from=build --chown=web:web /app/.next/static ./.next/static
COPY --from=build --chown=web:web /app/public ./public

USER web
EXPOSE 3000
CMD ["node", "server.js"]
