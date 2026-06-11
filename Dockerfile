# ─── Étape 1 : Build frontend ─────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les manifestes en premier (cache Docker)
COPY package*.json ./
RUN npm ci --production=false

# Copier le code source et builder
COPY . .
RUN npm run build

# ─── Étape 2 : Image de production ───────────────────────────────────────────
FROM node:20-slim AS runner

# Puppeteer nécessite Chromium et ses dépendances
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm-dev \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Dire à Puppeteer d'utiliser le Chromium système
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Installer uniquement les dépendances de production
COPY package*.json ./
RUN npm ci --production

# Copier le build et le serveur compilé
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/src/lib ./src/lib
COPY --from=builder /app/prisma ./prisma

# Générer le client Prisma
RUN npx prisma generate

# Utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 scolango \
    && adduser --system --uid 1001 scolango
USER scolango

EXPOSE 3000

ENV NODE_ENV=production

# Appliquer les migrations puis démarrer
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.cjs"]
