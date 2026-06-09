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
  title: "MongPass - 한국 거주 몽골인을 위한 생활 플랫폼",
  description:
    "한국 거주 몽골인을 위한 몽골어 커뮤니티, 지역 상점, 생활 정보 플랫폼",
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
