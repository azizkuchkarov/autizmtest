"use client";

import { LocaleProvider } from "@/contexts/LocaleContext";
import AppToolbar from "@/components/AppToolbar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LocaleProvider>
      <AppToolbar />
      {children}
    </LocaleProvider>
  );
}
