import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Note: Amethysta font will be loaded via CSS @import or link tag if needed

export const metadata: Metadata = {
  title: "unl-bb",
  description: "unl-bb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <div className="min-h-screen">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
