import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gia Đình Việt",
    short_name: "Gia Đình Việt",
    description: "Ứng dụng quản lý gia phả dòng họ",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0d9488",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
