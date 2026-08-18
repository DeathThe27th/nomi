import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nomi — Voice financial assistant",
    short_name: "Nomi",
    description: "Speak naturally, review the plan, and act on X Layer.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5ef",
    theme_color: "#11100f",
    orientation: "portrait-primary",
    categories: ["finance", "productivity"],
    icons: [
      {
        src: "/nomi-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/nomi-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
