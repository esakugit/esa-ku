import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@esa/db"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
  serverExternalPackages: ["pg", "pg-native"],
};

export default nextConfig;
