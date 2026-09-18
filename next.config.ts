import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.vimeocdn.com",
        port: "",
        pathname: "/video/**",
        search: "",
      },
    ],
  },
  allowedDevOrigins: ["192.168.253.*"],
};

export default nextConfig;
