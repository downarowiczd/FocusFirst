import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 ships a native .node binary that must be loaded at runtime,
  // not bundled by Turbopack/webpack.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
