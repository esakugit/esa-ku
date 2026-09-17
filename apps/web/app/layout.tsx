import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { ToastProvider } from "@/components/Toast";
import { PageTransition } from "@/components/PageTransition";

export const metadata: Metadata = {
  title: "ESA Campus Platform",
  description:
    "Engineering Students Association — Kenyatta University. Membership Badge, events, timetable, and past papers.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2E3F92",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/*
          Plus Jakarta Sans via a plain stylesheet <link> rather than
          next/font/google — next/font fetches the font file at BUILD time,
          which means a Vercel build with any transient trouble reaching
          Google's servers fails the whole deploy. A runtime <link> can never
          fail a build; worst case a visitor briefly sees the fallback stack
          in globals.css before the stylesheet loads.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ToastProvider>
          <PageTransition>{children}</PageTransition>
          <ServiceWorkerRegister />
        </ToastProvider>
      </body>
    </html>
  );
}
