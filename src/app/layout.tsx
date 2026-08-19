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

// Link previews (Kakao / Facebook / Telegram) read these. The audience
// is Mongolian, so the shareable identity is Mongolian-first; the
// Korean line stays in the description for Korean-language surfaces.
// metadataBase anchors the og:image to the canonical domain even when
// a preview deployment is being shared.
export const metadata: Metadata = {
  metadataBase: new URL("https://mongpass.kr"),
  title: "MongPass — Солонгос дахь монголчуудын цогц платформ",
  description:
    "Солонгос дахь монголчуудын цогц платформ — дэлгүүр, захиалга, зар, мэдээ. 한국 거주 몽골인을 위한 생활 플랫폼.",
  openGraph: {
    title: "MongPass",
    description: "Солонгос дахь монголчуудын цогц платформ",
    siteName: "MongPass",
    type: "website",
    locale: "mn_MN",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MongPass",
    description: "Солонгос дахь монголчуудын цогц платформ",
    images: ["/og-image.png"],
  },
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
