import type { Metadata } from "next";
import "./globals.css";
import { AdminNav } from "../components/nav";
import { AuthProvider } from "../components/auth-context";

export const metadata: Metadata = {
  title: "DriveConnect Admin",
  description: "DriveConnect marketplace operations, verification, payments, and complaints."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AdminNav />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
