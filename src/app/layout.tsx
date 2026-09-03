import type { Metadata } from "next";
import { getFacilityName } from "@/lib/facility";
import "./globals.css";

// No webfont. The app is set in Arial/Helvetica via --font-body in
// globals.css, which is what it rendered in originally: the pre-Modernist
// layout did load Geist here, but `body { font-family: Arial, … }`
// overrode it, so the download was never actually shown to anyone.

export async function generateMetadata(): Promise<Metadata> {
  const hospitalName = await getFacilityName();
  return {
    title: `${hospitalName} — Hospital Administration & Management System`,
    description: "Self-hosted hospital administration and management system.",
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
