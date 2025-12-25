import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/services/auth-context";
import Navbar from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Lumen Blog - Modern Yazı Platformu",
  description: "Fikirlerinizi paylaşın, hikayeler anlatın. Lumen ile yazarlık yolculuğunuz başlasın.",
  keywords: ["blog", "yazı", "makale", "hikaye", "platform"],
  authors: [{ name: "Lumen Team" }],
  openGraph: {
    title: "Lumen Blog",
    description: "Modern Yazı Platformu",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans antialiased">
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
