import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BiManager",
    short_name: "BiManager",
    description:
      "Biodlingshantering: bigårdar, samhällen, händelser, påminnelser och kassabok",
    lang: "sv",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#f59e0b",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
