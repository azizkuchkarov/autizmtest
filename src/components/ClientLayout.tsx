"use client";

import { LocaleProvider } from "@/contexts/LocaleContext";
import AppToolbar from "@/components/AppToolbar";
import HelpWidget from "@/components/HelpWidget";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LocaleProvider>
      <AppToolbar />
      {children}
      <HelpWidget />
    </LocaleProvider>
  );
}
