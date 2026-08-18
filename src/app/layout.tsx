import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist } from "next/font/google";
import { Providers } from "@/components/providers";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nomi — Your money, in your own words",
  description: "A conversation-first financial assistant for X Layer.",
  applicationName: "Nomi",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Nomi",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/nomi-mark.svg",
    apple: "/nomi-mark.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#11100f",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} antialiased`}>
      <body>
        {/*
          THESIS: Conversation is the financial workspace; no trading dashboard.
          OWN-WORLD: Paper, ink, apricot signal, tactile message and plan objects.
          STORY: Speak or type, inspect the exact plan, confirm, receive proof.
          FIRST VIEWPORT: Nomi chat leads; wallet balance is quiet and persistent.
          FORM: Operate-mode messaging interface for a mobile-first PWA.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
        */}
        <Providers>{children}</Providers>
        <PwaRegister />
      </body>
    </html>
  );
}
