import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  trailingSlash: false,
  // Deploy ကို subpath မှာ လုပ်ရင် (ဥပမာ weblive.com/myapp) .env မှာ NEXT_PUBLIC_BASE_PATH=/myapp ထည့်ပါ
  ...(basePath && { basePath }),
};

export default nextConfig;
