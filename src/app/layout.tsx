import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://autizmtest.uz"),
  title: {
    default: "Autizm skrining — Bola rivojlanishi va autizm belgilari",
    template: "%s | Autizm skrining",
  },
  description:
    "2–9 yoshli bolalar uchun professional autizm belgilari skrining testi. 3 soha: ijtimoiy aloqa, muloqot, cheklangan xatti-harakatlar. AI xulosa, PDF hisobot, ABA markazlar.",
  keywords: [
    "autizm skrining",
    "bola rivojlanishi",
    "autizm belgilari",
    "skrining test",
    "ota-ona so'rovnomasi",
    "Uzbekistan",
  ],
  authors: [{ name: "Autizm skrining" }],
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    title: "Autizm skrining — Bola rivojlanishi va autizm belgilari",
    description:
      "2–9 yoshli bolalar uchun professional autizm belgilari skrining testi. AI xulosa, PDF hisobot.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Autizm skrining — Bola rivojlanishi va autizm belgilari",
    description: "2–9 yoshli bolalar uchun autizm belgilari skrining testi.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
