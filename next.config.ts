import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  skipTrailingSlashRedirect: true,  // disable automatic slash redirects
  eslint: {
    ignoreDuringBuilds: true, 
  },
};

export default nextConfig;
