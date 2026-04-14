import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AudioPlayer } from '@/components/AudioPlayer/AudioPlayer';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Etymon: Interactive Etymology Explorer",
  description: "See how words evolve across 1000 years",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jetbrains.variable}`}>
      <body className="antialiased">
        {/* Main content */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Global Audio Player */}
        <AudioPlayer autoPlay={true} defaultVolume={0.3} />
      </body>
    </html>
  );
}
