import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getFacilityName } from "@/lib/facility";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const hospitalName = await getFacilityName();
  return {
    title: `${hospitalName} — Hospital Administration & Management System`,
    description: "Self-hosted hospital administration and management system.",
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
