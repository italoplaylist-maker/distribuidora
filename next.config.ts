import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Product photos are sent as compressed base64 data URLs through server actions;
    // the default 1MB limit is too tight for that payload.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
