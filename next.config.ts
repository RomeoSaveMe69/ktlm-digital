import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false, // /login only (not /login/)
};

export default nextConfig;
