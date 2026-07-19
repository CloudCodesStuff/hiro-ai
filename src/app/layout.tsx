import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  title: "HIRO AI — Personal Transformation Coach",
  description:
    "Your personal AI coach for fitness, nutrition, skincare, and hair. Evidence-based advice for busy adults 30+.",
  icons: {
    icon: "/hiro-logo.png",
  },
  openGraph: {
    title: "HIRO AI — Personal Transformation Coach",
    description:
      "Your personal AI coach for fitness, nutrition, skincare, and hair.",
    images: ["/hiro-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-black text-white">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
