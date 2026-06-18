"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface ShareActionsProps {
  shareUrl: string;
  courseTitle: string;
  completionDate: string;
}

export function ShareActions({ shareUrl, courseTitle, completionDate }: ShareActionsProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // LinkedIn "Add to Profile" certificate link
  const issued = new Date(completionDate);
  const linkedInUrl = new URL("https://www.linkedin.com/profile/add");
  linkedInUrl.searchParams.set("startTask", "CERTIFICATION_NAME");
  linkedInUrl.searchParams.set("name", courseTitle);
  linkedInUrl.searchParams.set("organizationName", "Mentoria Hub");
  linkedInUrl.searchParams.set("issueYear", String(issued.getFullYear()));
  linkedInUrl.searchParams.set("issueMonth", String(issued.getMonth() + 1));
  linkedInUrl.searchParams.set("certUrl", shareUrl);

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-2 rounded-full border border-[--color-border] bg-[--color-surface] px-5 h-10 text-sm font-semibold text-[--color-fg] hover:border-[--color-brand]/40 hover:text-[--color-brand] transition-colors"
      >
        {copied ? (
          <>
            <Check size={14} strokeWidth={2.5} className="text-[--color-brand]" />
            Copied!
          </>
        ) : (
          <>
            <Copy size={14} strokeWidth={2} />
            Copy link
          </>
        )}
      </button>

      <a
        href={linkedInUrl.toString()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-[#0077B5] px-5 h-10 text-sm font-semibold text-white hover:bg-[#005f8e] transition-colors"
      >
        {/* LinkedIn "in" logo */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
        Add to LinkedIn
      </a>
    </div>
  );
}
