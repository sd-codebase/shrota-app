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
    "Discover thousands of audiobooks, stories, and original content in multiple languages. Download the Shrota app and start listening today.",
  keywords: [
    "audiobooks",
    "audio stories",
    "podcast",
    "hindi audiobooks",
    "regional audiobooks",
    "shrota",
  ],
  openGraph: {
    title: "Shrota - Premium Audiobooks & Stories",
    description:
      "Discover thousands of audiobooks, stories, and original content in multiple languages.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shrota - Premium Audiobooks & Stories",
    description:
      "Discover thousands of audiobooks, stories, and original content in multiple languages.",
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
