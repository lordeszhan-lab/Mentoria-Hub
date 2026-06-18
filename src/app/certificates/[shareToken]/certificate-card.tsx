"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Award } from "lucide-react";

interface CertificateCardProps {
  studentName: string;
  courseTitle: string;
  completionFormatted: string;
}

export function CertificateCard({
  studentName,
  courseTitle,
  completionFormatted,
}: CertificateCardProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-lg"
    >
      {/* Certificate card */}
      <div
        className="relative overflow-hidden rounded-2xl bg-white"
        style={{
          boxShadow:
            "0 4px 6px -1px rgba(0,0,0,0.06), 0 20px 48px -8px rgba(22,163,74,0.12), 0 0 0 1px rgba(22,163,74,0.12)",
        }}
      >
        {/* Top accent bar */}
        <div
          className="h-1.5 w-full"
          style={{ background: "linear-gradient(90deg, #16A34A 0%, #22C55E 60%, #86EFAC 100%)" }}
        />

        {/* Corner decorations */}
        <CornerOrnament className="absolute top-6 left-6" />
        <CornerOrnament className="absolute top-6 right-6 rotate-90" />
        <CornerOrnament className="absolute bottom-6 left-6 -rotate-90" />
        <CornerOrnament className="absolute bottom-6 right-6 rotate-180" />

        {/* Content */}
        <div className="px-10 pt-10 pb-12 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mentoria-logo.png"
              alt="Mentoria Hub"
              width={140}
              height={40}
              style={{ objectFit: "contain", height: 40, width: "auto" }}
            />
          </div>

          {/* Certificate of Completion header */}
          <p
            className="text-[11px] font-bold tracking-[0.18em] uppercase mb-6"
            style={{ color: "#16A34A" }}
          >
            Certificate of Completion
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <span className="flex-1 border-t border-green-100" />
            <Award size={18} className="shrink-0" style={{ color: "#16A34A" }} strokeWidth={1.6} />
            <span className="flex-1 border-t border-green-100" />
          </div>

          {/* Body copy */}
          <p className="text-sm text-gray-400 mb-2">This certifies that</p>

          <h1
            className="text-3xl font-extrabold tracking-tight mb-4"
            style={{ color: "#111827" }}
          >
            {studentName}
          </h1>

          <p className="text-sm text-gray-400 mb-2">has successfully completed</p>

          <h2
            className="text-xl font-bold leading-snug mb-6 px-4"
            style={{ color: "#111827" }}
          >
            {courseTitle}
          </h2>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <span className="flex-1 border-t border-green-100" />
            <span className="text-green-200 text-xs">✦</span>
            <span className="flex-1 border-t border-green-100" />
          </div>

          {/* Date + Issuer row */}
          <div className="flex items-end justify-between px-2">
            <div className="text-left">
              <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-0.5">
                Issued
              </p>
              <p className="text-sm font-bold text-gray-700">{completionFormatted}</p>
            </div>

            {/* Seal */}
            <div
              className="flex size-16 items-center justify-center rounded-full border-2"
              style={{
                borderColor: "#16A34A",
                background: "#F0FDF4",
              }}
            >
              <div
                className="flex size-11 items-center justify-center rounded-full"
                style={{ background: "#16A34A" }}
              >
                <Award size={20} className="text-white" strokeWidth={1.6} />
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-0.5">
                Issued by
              </p>
              <p className="text-sm font-bold text-gray-700">Mentoria Hub</p>
            </div>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div
          className="h-0.5 w-full"
          style={{ background: "linear-gradient(90deg, transparent 0%, #16A34A40 50%, transparent 100%)" }}
        />
      </div>
    </motion.div>
  );
}

// ── Corner ornament ───────────────────────────────────────────────────────────

function CornerOrnament({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M2 18 L2 2 L18 2"
        stroke="#16A34A"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.3"
      />
    </svg>
  );
}
