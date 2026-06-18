import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  getOpportunity,
  getCategories,
} from "@/server/admin/opportunities";
import { OpportunityForm } from "@/components/admin/opportunity-form";

export default async function EditOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [opportunity, categories] = await Promise.all([
    getOpportunity(id),
    getCategories(),
  ]);

  if (!opportunity) notFound();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/opportunities"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 mb-3"
        >
          <ChevronLeft size={13} strokeWidth={2} aria-hidden />
          Back to opportunities
        </Link>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Edit Opportunity</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{opportunity.id}</p>
      </div>

      <OpportunityForm
        categories={categories}
        initial={opportunity}
        editId={id}
      />
    </div>
  );
}
