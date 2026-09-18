import path from "node:path";
import { fileURLToPath } from "node:url";

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Los packages del monorepo se consumen como TS fuente (workspace:*) — transpilarlos acá.
  transpilePackages: [
    "@depaso/domain",
    "@depaso/optimization",
    "@depaso/types",
    "@depaso/validation",
  ],
  // Prisma trae un motor nativo (binario) que Next debe copiar al bundle serverless. Con pnpm
  // en monorepo vive fuera de apps/api, así que hace falta fijar la raíz de tracing y no
  // bundlear el cliente; sin esto toda consulta falla en runtime con "could not locate the
  // Query Engine" (Vercel).
  outputFileTracingRoot: monorepoRoot,
  serverExternalPackages: ["@prisma/client", "prisma"],
  outputFileTracingIncludes: {
    "/**": ["../../node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/*"],
  },
};

export default nextConfig;
