# ─────────────────────────────────────────────────────────────
# Etapa 1: build
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar deps con cache de capas
COPY package*.json ./
RUN npm ci

# Copiar el código y compilar
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
COPY scripts ./scripts

RUN npm run build

# ─────────────────────────────────────────────────────────────
# Etapa 2: runtime (más liviana, sin devDependencies)
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

# Solo runtime deps
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Artefacto compilado
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts

# Railway / Render setean el puerto vía $PORT.
EXPOSE 3001

CMD ["node", "dist/main.js"]
