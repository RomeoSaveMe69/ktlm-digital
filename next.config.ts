import type { NextConfig } from "next";
import { getBasePath } from "@/lib/config";

const basePath = getBasePath();

const nextConfig: NextConfig = {
  trailingSlash: false,
  // Deploy ကို subpath မှာ လုပ်ရင် (ဥပမာ weblive.com/myapp) .env မှာ NEXT_PUBLIC_BASE_PATH=/myapp ထည့်ပါ
  ...(basePath && { basePath }),
};

export default nextConfig;
