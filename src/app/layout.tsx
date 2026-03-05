import type { Metadata } from "next";
import { Outfit, Geist } from "next/font/google";
import "./globals.css";
import { AOSInit } from "@/components/AOSInit";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ACADEMY OF SPORTS AND FINE ARTS | Empowering Every Athlete",
  description: "ASFA focuses on empowering athletes from underprivileged, tribal, rural, and differently-abled communities across India. Building international-level athletes through inclusive training.",
  keywords: ["Sports Academy", "NGO", "Athletics", "Paralympics", "Wheelchair Sports India", "Nenavath Vinod", "Telangana Sports", "ASFA", "Academy of Sports and Fine Arts"],
  authors: [{ name: "Nenavath Vinod" }],
  openGraph: {
    title: "ACADEMY OF SPORTS AND FINE ARTS",
    description: "Empowering athletes from underprivileged and differently-abled communities across India.",
    url: "https://www.asfaacademy.org",
    siteName: "ASFA Academy",
    images: [
      {
        url: "/og-image.png", // Ensure this image exists in public/
        width: 1200,
        height: 630,
        alt: "ASFA Academy Logo and Athletes",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ACADEMY OF SPORTS AND FINE ARTS",
    description: "Empowering athletes from underprivileged and differently-abled communities across India.",
    images: ["/og-image.png"],
  },
  verification: {
    google: "YOUR_GOOGLE_VERIFICATION_CODE_HERE",
  },
  robots: {
    index: true,
    follow: true,
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
        className={`${outfit.variable} ${geistSans.variable} font-sans antialiased`}
      >
        <AOSInit />
        {children}
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
