# syntax=docker/dockerfile:1

ARG NODE_VERSION=24.14.1

# --- Base ---
FROM node:${NODE_VERSION}-slim AS base
WORKDIR /usr/src/app

# --- Dependencies (full, for build) ---
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# --- Build ---
FROM deps AS build
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build:api

# --- Production dependencies only ---
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- Runtime (distroless) ---
FROM gcr.io/distroless/nodejs24-debian13:nonroot AS runtime
WORKDIR /usr/src/app

COPY --from=prod-deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY package.json .

ENV NODE_ENV=production

EXPOSE 3000

USER nonroot

CMD ["dist/main.js"]
