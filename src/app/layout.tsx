import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F6FB" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0C18" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://autizmtest.uz"),
  title: {
    default: "Autizm skrining — Bola rivojlanishi va autizm belgilari",
    template: "%s | Autizm skrining",
  },
  description:
    "Bepul autizm belgilari skrining testi, mutaxassislardan video darslar va uyda mashqlar. 3 soha: ijtimoiy aloqa, muloqot, takroriy xatti-harakatlar. AI xulosa va ABA markazlari.",
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
      "Bepul autizm belgilari skrining testi, video darslar va uyda mashqlar.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Autizm skrining — Bola rivojlanishi va autizm belgilari",
    description: "Bepul autizm belgilari skrining testi, video darslar va uyda mashqlar.",
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
      <body className={`${manrope.variable} antialiased`}>{children}</body>
    </html>
  );
}
