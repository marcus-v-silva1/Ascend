import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ascend",
    short_name: "Ascend",
    description: "Estudos, carreira, hábitos e finanças: um passo de cada vez.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0e1525",
    theme_color: "#0e1525",
    lang: "pt-BR",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
