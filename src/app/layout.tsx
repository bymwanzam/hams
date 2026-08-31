import type { Metadata } from "next";
import { Newsreader, Source_Sans_3 } from "next/font/google";
import { getFacilityName } from "@/lib/facility";
import "./globals.css";

// The Calm Clinical design system pairs Newsreader (headings — a quiet
// transitional serif that reads as "trusted institution") with Source
// Sans 3 (body/UI). Both loaded here via next/font (self-hosted, no
// runtime Google Fonts request) as variable fonts, and exposed as the
// --font-newsreader / --font-source-sans CSS variables, which globals.css
// maps onto --font-heading / --font-body.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
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
      className={`${newsreader.variable} ${sourceSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
