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
};

export default nextConfig;
