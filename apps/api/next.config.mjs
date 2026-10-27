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
  // Prisma trae un motor nativo (binario): no se bundlea el cliente.
  outputFileTracingRoot: monorepoRoot,
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
