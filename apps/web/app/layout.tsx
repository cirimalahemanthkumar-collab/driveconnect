import type { Metadata } from "next";
import "./globals.css";
import { SiteNav } from "../components/site-nav";

export const metadata: Metadata = {
  title: "DriveConnect",
  description: "Driving school discovery, booking, tracking, payments, and licence guidance."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
