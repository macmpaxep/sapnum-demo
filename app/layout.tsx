import type { Metadata } from "next";
import { Unbounded, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";

const display = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const body = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SAPNUM — соцсеть для предпринимателей, где бизнес говорит цифрами",
    template: "%s — SAPNUM",
  },
  description:
    "Закрытая платформа для собственников и топ-менеджеров: делитесь метриками компании, сравнивайте себя с похожими бизнесами и получайте разбор от ИИ-аналитика на базе Claude.",
  keywords: [
    "соцсеть для бизнеса",
    "метрики компании",
    "бенчмаркинг бизнеса",
    "сообщество предпринимателей",
    "ИИ для бизнеса",
  ],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: siteUrl,
    siteName: "SAPNUM",
    title: "SAPNUM — соцсеть для предпринимателей, где бизнес говорит цифрами",
    description:
      "Делитесь метриками компании, сравнивайте себя с похожими бизнесами и получайте разбор от ИИ-аналитика.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SAPNUM — соцсеть для предпринимателей",
    description: "Бизнес говорит цифрами. Присоединяйтесь к раннему доступу.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SAPNUM",
    url: siteUrl,
    description:
      "Закрытая соцсеть для предпринимателей: метрики компаний, обсуждения и ИИ-аналитика.",
  };

  return (
    <html lang="ru" className={`${display.variable} ${mono.variable} ${body.variable}`}>
      <body className="font-body antialiased">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
