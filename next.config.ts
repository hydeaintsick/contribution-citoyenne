import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/dsfr/icons/:path*",
        destination: "/dsfr/icons/:path*",
      },
    ];
  },
};

export default nextConfig;
