"use client"; // ✅ Required for SessionProvider

import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react"; // ✅ Import SessionProvider
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({ children }) {
  return (
    <SessionProvider> {/* ✅ Wrap entire app with SessionProvider */}
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          {children}
        </body>
      </html>
    </SessionProvider>
  );
}
