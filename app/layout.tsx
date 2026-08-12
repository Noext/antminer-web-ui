import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Antminer Dashboard",
  description: "Surveillance en temps réel de votre Antminer",
  manifest: "/manifest.webmanifest",
  applicationName: "Antminer Dashboard",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Antminer",
  },
  icons: {
    icon: [
      { url: "/icons/antminer-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/antminer-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/icons/antminer-apple-touch.png", type: "image/png", sizes: "180x180" },
    ],
  },
};

export const viewport = {
  themeColor: "#06b6d4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
