import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/office',
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
