import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { ToastProvider } from "@/components/Toast";
import { PageTransition } from "@/components/PageTransition";
import { InstallAppPrompt } from "@/components/InstallAppPrompt";

export const metadata: Metadata = {
  title: "ESA Campus Platform",
  applicationName: "ESA KU",
  description:
    "Engineering Students Association — Kenyatta University. Membership Card, events, timetable, and past papers.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ESA KU",
  },
};

export const viewport: Viewport = {
  themeColor: "#2554D7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/*
          IBM Plex Sans via stylesheet link for resilience and fast loading.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ToastProvider>
          <PageTransition>{children}</PageTransition>
          <ServiceWorkerRegister />
          <InstallAppPrompt />
        </ToastProvider>
      </body>
    </html>
  );
}
