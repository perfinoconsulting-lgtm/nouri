import type { Metadata } from "next";
import { Noto_Naskh_Arabic, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const notoNaskh = Noto_Naskh_Arabic({ 
  subsets: ["arabic"],
  variable: '--font-noto-naskh',
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: "NourAl - Apprendre l'arabe",
  description: "L'apprentissage ludique de l'arabe pour les enfants",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${notoNaskh.variable}`}>
      <body className="min-h-screen antialiased bg-white text-primary">
        {children}
      </body>
    </html>
  );
}
