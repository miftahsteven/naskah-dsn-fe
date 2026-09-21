import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH !== undefined
  ? process.env.NEXT_PUBLIC_BASE_PATH
  : '/office';

const nextConfig: NextConfig = {
  basePath: basePath || undefined,
  skipTrailingSlashRedirect: true,
  async redirects() {
    if (basePath) {
      return [
        {
          source: '/',
          destination: basePath,
          basePath: false,
          permanent: false,
        },
        {
          source: '/privacy-policy-amanah-dsn-mui.html',
          destination: `${basePath}/privacy-policy-amanah-dsn-mui.html`,
          basePath: false,
          permanent: false,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
