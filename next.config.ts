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
  serverExternalPackages: ["sharp", "@aws-sdk/client-s3"],
};

export default nextConfig;
