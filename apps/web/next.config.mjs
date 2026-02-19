import process from "node:process";

function normalizeBasePath(basePath) {
  const trimmed = basePath.trim();

  if (!trimmed || trimmed === "/") {
    return "";
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, "");
}

const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(basePath ? { basePath } : {}),
  transpilePackages: ["@flyt-tribe/ui", "@flyt-tribe/db", "@flyt-tribe/api", "@flyt-tribe/auth"],
};

export default nextConfig;
