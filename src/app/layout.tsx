import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter — free, SIL Open Font License. The latin + cyrillic subsets
// cover Mongolian (Cyrillic script) so headings and body share the
// same family across English and Mongolian copy.
const sans = Inter({
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
