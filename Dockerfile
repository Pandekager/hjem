FROM oven/bun:1-alpine

WORKDIR /app

COPY package*.json bun.lock ./
RUN bun install

COPY . .

RUN bun run build

EXPOSE 3002

ENV HOST=0.0.0.0
ENV PORT=3002
ENV NITRO_PORT=3002
ENV NITRO_HOST=0.0.0.0

CMD ["bun", "run", ".output/server/index.mjs"]
