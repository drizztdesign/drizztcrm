import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DRIZZT DESIGN · CRM",
  description: "CRM premium bilingüe para DRIZZT DESIGN",
  // Icons are auto-detected from src/app/icon.tsx and src/app/apple-icon.tsx
  // Manifest is auto-detected from src/app/manifest.ts
  appleWebApp: {
    capable: true,
    title: "Drizzt CRM",
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#0a0b0d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${jetbrains.variable}`}>
      <body data-density="regular">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
