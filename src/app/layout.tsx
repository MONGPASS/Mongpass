import type { Metadata, Viewport } from "next";
import "./globals.css";

// Gilroy is loaded site-wide via @font-face declarations in globals.css
// (light/regular/medium/bold/heavy from cdnfonts.com) — no next/font
// loader needed here. Tailwind's font-sans family already lists
// 'Gilroy' first.

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
      <body className="font-sans antialiased">
        <div className="mobile-container">
          {children}
        </div>
      </body>
    </html>
  );
}
