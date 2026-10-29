# DePaso API (Next.js) para EasyPanel. Se construye desde la raíz del repo:
#   docker build -t depaso-api .
FROM node:22-bookworm-slim

# openssl: lo necesita el motor de Prisma. curl: lo usan los cron jobs de EasyPanel.
RUN apt-get update && apt-get install -y --no-install-recommends openssl curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable
WORKDIR /app

# Primero el código (el lockfile necesita ver todos los package.json del workspace).
COPY . .
RUN pnpm install --frozen-lockfile --config.node-linker=isolated \
  --filter @depaso/api... --filter @depaso/data-sources-sepa...

ENV NEXT_TELEMETRY_DISABLED=1
# El build solo genera el cliente de Prisma y compila Next: no necesita base de datos.
RUN DATABASE_URL="mysql://build:build@localhost:3306/build" pnpm --filter @depaso/api run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Al arrancar aplica las migraciones, carga los logos de las cadenas en la base y levanta el servidor.
CMD ["sh", "-c", "pnpm --filter @depaso/database run migrate:deploy && (pnpm --filter @depaso/database run db:brand-logos || echo 'logos: no se pudieron cargar') && pnpm --filter @depaso/api run start"]
