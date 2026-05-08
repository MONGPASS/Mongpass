import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

// Manrope is the closest free clone of Gilroy (the proprietary
// $249-license display font many Korean/SaaS sites use). The
// metric/proportions are nearly identical, so most "Gilroy"-styled
// designs render unchanged. To swap in actual licensed Gilroy later,
// drop the .woff2 files into ./fonts/ and replace this with
// `localFont({ src: [...], variable: "--font-sans" })`.
const sans = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MongPass - MongolHub",
  description: "Бүх үйлчилгээг нэг дороос - All services in one place",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <body className={`${sans.variable} font-sans antialiased`}>
        <div className="mobile-container">
          {children}
        </div>
      </body>
    </html>
  );
}
