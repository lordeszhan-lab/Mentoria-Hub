import { Wand2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { IngestClient } from "./ingest-client";

export default async function IngestPage() {
  const t = await getTranslations("admin");
  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        {/* Thin lucide icon in green chip — no emoji */}
        <span
          className="flex items-center justify-center size-9 rounded-xl bg-primary/10 text-primary shrink-0"
          aria-hidden
        >
          <Wand2 size={16} strokeWidth={1.6} />
        </span>
        <h1 className="text-xl font-bold text-foreground tracking-tight">{t("aiIngest")}</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6 ml-12">
        {t("ingestIntro")}
      </p>

      <IngestClient />
    </div>
  );
}
