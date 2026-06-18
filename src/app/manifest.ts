import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mentoria Hub",
    short_name: "Mentoria",
    description:
      "Your academic roadmap for grades 8–11. Discover courses, track progress, and land your dream university.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F6F8F7",
    theme_color: "#16A34A",
    categories: ["education"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [],
  };
}
