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
  themeColor: '#cdb4f0', // Change this from the green to purple
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
