import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCourseWithModules } from "@/server/admin/courses";
import { getCategories } from "@/server/admin/opportunities";
import { CourseForm } from "@/components/admin/course-form";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [course, categories] = await Promise.all([
    getCourseWithModules(id),
    getCategories(),
  ]);

  if (!course) notFound();

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
        <h1 className="text-xl font-bold text-foreground tracking-tight">Edit Course</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{course.id}</p>
      </div>

      <CourseForm categories={categories} initial={course} editId={id} />
    </div>
  );
}
