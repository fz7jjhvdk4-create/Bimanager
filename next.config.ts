import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Undvik att bundla paket med native-beroenden på serversidan
  serverExternalPackages: ["@react-pdf/renderer", "pg"],
  async redirects() {
    // Gamla fakturaflödet ersatt av /betalning/faktura,
    // statistiksidan sammanslagen med översikten
    return [
      {
        source: "/statistik",
        destination: "/",
        permanent: true,
      },
      {
        source: "/fakturering",
        destination: "/betalning/faktura",
        permanent: true,
      },
      {
        source: "/fakturering/ny",
        destination: "/betalning/faktura/ny",
        permanent: true,
      },
      {
        source: "/fakturering/:id",
        destination: "/betalning/faktura/:id",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
