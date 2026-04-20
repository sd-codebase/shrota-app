import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shrota - Premium Audiobooks & Stories",
  description:
    "Discover thousands of Marathi audiobooks, stories, and original content. Download the Shrota app and start listening today.",
  keywords: [
    "audiobooks",
    "audio stories",
    "podcast",
    "marathi audiobooks",
    "marathi stories",
    "shrota",
  ],
  openGraph: {
    title: "Shrota - Premium Audiobooks & Stories",
    description:
      "Discover thousands of Marathi audiobooks, stories, and original content.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shrota - Premium Audiobooks & Stories",
    description:
      "Discover thousands of Marathi audiobooks, stories, and original content.",
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
        className={`${poppins.variable} ${inter.variable} antialiased bg-bg-primary text-text-primary min-h-screen flex flex-col`}
      >
        <Navbar />
        <main className="flex-grow">{children}</main>
        <ConditionalFooter />
      </body>
    </html>
  );
}
