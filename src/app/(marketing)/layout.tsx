import { Toaster } from "@/components/ui/sonner";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { BackgroundGrid } from "@/components/marketing/background-grid";
import { LenisInit } from "@/components/marketing/lenis-init";
import { getLocale } from "next-intl/server";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthed = false;
  const locale = await getLocale();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-foreground focus:px-3 focus:py-2 focus:text-[13px] focus:font-medium focus:text-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to content
      </a>
      <LenisInit />
      <BackgroundGrid />
      <MarketingHeader isAuthed={isAuthed} activeLocale={locale} />
      <div id="main-content" className="relative flex-1">
        {children}
      </div>
      <MarketingFooter activeLocale={locale} />
      <Toaster richColors position="top-center" />
    </div>
  );
}
