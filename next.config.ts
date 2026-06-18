import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "**.vivahome.de",
      },
    ],
  },
  serverExternalPackages: ["sharp", "@aws-sdk/client-s3", "exif-reader"],
  experimental: {
    // Image uploads run through Server Actions; raise the default 1 MB limit.
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
