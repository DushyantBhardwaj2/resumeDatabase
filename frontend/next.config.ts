import type { NextConfig } from "next";
import path from "path";

const BACKEND_URL = process.env.BACKEND_URL || "https://resumint-backend-ihjf.onrender.com"

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  httpAgentOptions: {
    keepAlive: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "*.githubusercontent.com" },
    ],
  },
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
  // API proxy — dev → localhost:8080, production → Render backend
  async rewrites() {
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:8080/api/:path*",
        },
      ];
    }
    // Production: proxy all /api/* to Render
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
  // Experimental body size and proxy config
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
