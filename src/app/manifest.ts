import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NIRVAYU (निर्वायु) – Breathe Smarter, India.",
    short_name: "NIRVAYU",
    description:
      "Live Indian AQI intelligence & personalized clean-air household plans powered by Gemini.",
    start_url: "/",
    display: "standalone",
    background_color: "#08111E",
    theme_color: "#0F766E",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
