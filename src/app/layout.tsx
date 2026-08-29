import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { getFacilityName } from "@/lib/facility";
import "./globals.css";

// The Modernist design system is set entirely in Archivo. Loaded here via
// next/font (self-hosted, no runtime Google Fonts request) and exposed as
// the --font-archivo CSS variable, which globals.css maps onto
// --font-heading / --font-body.
const archivo = Archivo({
  variable: "--font-archivo",
  weight: ["400", "600", "800"],
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
    <html lang="en" className={`${archivo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
