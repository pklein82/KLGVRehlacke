# syntax=docker/dockerfile:1

# ---- Abhängigkeiten bauen ----------------------------------------------------
# better-sqlite3 bringt vorkompilierte Binärdateien mit; die Build-Werkzeuge
# sind nur die Rückfallebene, falls für die Plattform keine vorliegt.
FROM node:22-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Laufzeit ----------------------------------------------------------------
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/data/db \
    UPLOAD_DIR=/data/uploads

COPY --from=deps /app/node_modules ./node_modules
COPY package.json server.js ./
COPY src ./src
COPY views ./views
COPY public ./public
COPY seed-assets ./seed-assets

# Datenbank und Uploads liegen außerhalb des Abbilds. Ohne ein hier
# eingehängtes Volume sind alle Inhalte beim nächsten Neustart verloren.
VOLUME ["/data"]

RUN mkdir -p /data/db /data/uploads && chown -R node:node /data
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
