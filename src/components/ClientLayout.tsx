"use client";

import { LocaleProvider } from "@/contexts/LocaleContext";
import AppToolbar from "@/components/AppToolbar";
import HelpWidget from "@/components/HelpWidget";
import SiteFooter from "@/components/SiteFooter";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LocaleProvider>
      <div className="flex min-h-dvh flex-col">
        <AppToolbar />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <HelpWidget />
      </div>
    </LocaleProvider>
  );
}
