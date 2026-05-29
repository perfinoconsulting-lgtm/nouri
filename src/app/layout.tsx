import type { Metadata } from "next";
import { Noto_Naskh_Arabic, Inter, Baloo_2 } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const notoNaskh = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: '--font-noto-naskh',
  weight: ['400', '500', '600', '700']
});
const baloo2 = Baloo_2({
  subsets: ["latin"],
  variable: '--font-baloo',
  weight: ['400', '600', '800'],
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
    <html lang="fr" className={`${inter.variable} ${notoNaskh.variable} ${baloo2.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#F5A623" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NourAl" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap"
          as="style"
        />
      </head>
      <body className="min-h-screen antialiased bg-white text-primary">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .catch(function(err) {
                      console.error('SW registration failed:', err);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
