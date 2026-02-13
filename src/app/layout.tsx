import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 1. Move themeColor here
export const viewport = {
  themeColor: '#dddddd', 
  width: 'device-width',
  initialScale: 1,
}

export const metadata = {
  title: 'Little Voices',
  description: 'Capturing the funny things our kids say',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png', // This tells the browser tab what to show
    apple: '/icon-192.png', // This is for iPhones
  },
}

import FloatingNavbar from "@/components/FloatingNavbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="pb-24 antialiased"> {/* Added antialiased for cleaner text */}
        <main>{children}</main>
        <FloatingNavbar />
      </body>
    </html>
  );
}


