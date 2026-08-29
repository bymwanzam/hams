import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Default is 1mb; patient photo uploads (multipart Server Action
    // submissions) need more headroom.
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
