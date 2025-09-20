import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dog Coat Fit Finder | Find Your Perfect Pet Apparel",
  description: "Get personalized, breed-specific dog coat recommendations in under 2 minutes. Our AI-powered fit finder ensures the perfect match for your furry friend with 100% accurate sizing.",
  keywords: "dog coats, dog apparel, breed-specific sizing, pet clothing, waterproof dog coats, dog fit finder, personalized pet gear, custom dog sizing",
  openGraph: {
    title: "Dog Coat Fit Finder | Find Your Perfect Pet Apparel",
    description: "Get personalized, breed-specific dog coat recommendations in under 2 minutes. Our AI-powered fit finder ensures the perfect match for your furry friend.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dog Coat Fit Finder | Find Your Perfect Pet Apparel",
    description: "Get personalized, breed-specific dog coat recommendations in under 2 minutes.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ overflow: 'hidden' }}
      >
        {children}
      </body>
    </html>
  );
}
