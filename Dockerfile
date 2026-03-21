FROM oven/bun:1-alpine AS builder

WORKDIR /app

COPY package*.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

FROM oven/bun:1-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3002
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3002

COPY --from=builder /app/.output ./.output

EXPOSE 3002

CMD ["bun", "run", ".output/server/index.mjs"]
