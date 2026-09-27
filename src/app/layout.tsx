import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/ui/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { getTitlePrefix } from "@/lib/env";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const titlePrefix = getTitlePrefix();

export const metadata: Metadata = {
  metadataBase: new URL("https://ketnoicongdong.com"),
  title: {
    template: `${titlePrefix}%s · Kết Nối Cộng Đồng`,
    default: `${titlePrefix}Kết Nối Cộng Đồng (Community Connection)`,
  },
  description: "Nền tảng kết nối cộng đồng, quản lý gia phả dòng họ và tổ chức",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: `${titlePrefix}Kết Nối Cộng Đồng`,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={cn("antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body>
        <TooltipProvider>
          <AppShell>{children}</AppShell>
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
