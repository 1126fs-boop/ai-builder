import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Builder — 株式会社ワム",
  description: "美容 BtoB 営業向けプロンプト生成 — チーム版",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "AI Builder",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
