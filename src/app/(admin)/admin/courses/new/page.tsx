import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCategories } from "@/server/admin/opportunities";
import { CourseForm } from "@/components/admin/course-form";

export default async function NewCoursePage() {
  const categories = await getCategories();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 mb-3"
        >
          <ChevronLeft size={13} strokeWidth={2} aria-hidden />
          Back to courses
        </Link>
        <h1 className="text-xl font-bold text-foreground tracking-tight">New Course</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Build modules and lessons — changes are live immediately.
        </p>
      </div>

      <CourseForm categories={categories} />
    </div>
  );
}
