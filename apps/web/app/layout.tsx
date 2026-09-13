import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

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
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
