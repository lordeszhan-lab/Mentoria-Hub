import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCertificateByShareToken } from "@/server/courses/certificates";
import { ShareActions } from "./share-actions";
import { CertificateCard } from "./certificate-card";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}): Promise<Metadata> {
  const { shareToken } = await params;
  const cert = await getCertificateByShareToken(shareToken);
  if (!cert) return { title: "Certificate | Mentoria Hub" };
  return {
    title: `${cert.student_name} — ${cert.course_title} | Mentoria Hub`,
    description: `${cert.student_name} successfully completed "${cert.course_title}" on Mentoria Hub.`,
    openGraph: {
      title: `${cert.student_name} completed "${cert.course_title}"`,
      description: `Certificate of completion issued by Mentoria Hub on ${cert.completion_date}.`,
      type: "website",
    },
  };
}

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const cert = await getCertificateByShareToken(shareToken);

  if (!cert) notFound();

  const shareUrl =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/certificates/${shareToken}`
      : `https://mentoria.vercel.app/certificates/${shareToken}`;

  const completionFormatted = new Date(cert.completion_date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-[--color-canvas] flex flex-col items-center justify-center px-4 py-16">
      <CertificateCard
        studentName={cert.student_name}
        courseTitle={cert.course_title}
        completionFormatted={completionFormatted}
      />

      <ShareActions
        shareUrl={shareUrl}
        courseTitle={cert.course_title}
        completionDate={cert.completion_date}
      />

      <p className="mt-6 text-xs text-[--color-fg-faint] text-center">
        Certificate ID: <span className="font-mono">{cert.serial}</span>
      </p>
    </main>
  );
}
