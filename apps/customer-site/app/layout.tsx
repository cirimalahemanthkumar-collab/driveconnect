import type { Metadata } from "next";
import "./globals.css";
import { CustomerNav } from "../components/nav";
import { AuthProvider } from "../components/auth-provider";

export const metadata: Metadata = {
  title: "DriveConnect Customer",
  description: "Find verified driving schools, book courses, and track classes."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CustomerNav />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

