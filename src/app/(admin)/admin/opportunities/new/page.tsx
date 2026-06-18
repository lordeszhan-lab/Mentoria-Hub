import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCategories } from "@/server/admin/opportunities";
import { OpportunityForm } from "@/components/admin/opportunity-form";

export default async function NewOpportunityPage() {
  const categories = await getCategories();

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
        <h1 className="text-xl font-bold text-foreground tracking-tight">New Opportunity</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Embedding is computed on save — immediately matchable.
        </p>
      </div>

      <OpportunityForm categories={categories} />
    </div>
  );
}
