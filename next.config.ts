import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Undvik att bundla paket med native-beroenden på serversidan
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
