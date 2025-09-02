"use client";

import "./globals.css";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/layout/Navbar"; // adjust path if needed
import { ResearchNotepad } from "@/components/ui/research-notepad";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <Navbar />
          {children}
          <ResearchNotepad />
        </SessionProvider>
      </body>
    </html>
  );
}