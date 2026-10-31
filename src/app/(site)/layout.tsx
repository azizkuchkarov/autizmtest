import { AppProviders } from "@/components/app/providers";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
