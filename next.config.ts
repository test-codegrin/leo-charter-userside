import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   images: {
    remotePatterns: [
      // Production API
      {
        protocol: "https",
        hostname: "leocharter.codegrin.com",
        pathname: "/**",
      },
      // Local development
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/**",
      },
      // Add other domains as needed
      {
        protocol: "https",
        hostname: "www.leocharter.codegrin.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
