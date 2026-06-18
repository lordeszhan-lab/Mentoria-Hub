"use client";

import { motion } from "motion/react";
import { heroContainer, heroWord } from "@/lib/motion/variants";
import { cn } from "@/lib/utils";

interface Props {
  /** Full headline text. Words wrapped in *asterisks* render in brand green. */
  text: string;
  className?: string;
  as?: "h1" | "h2";
}

/**
 * Animated headline — splits into words, each animates in with a
 * blurred-to-sharp slide-up stagger. Words wrapped in *asterisks* are
 * highlighted in brand green (the single accent). Mirrors Seobloom's
 * HeroHeadline, extended with inline brand-highlight markup.
 *
 * Outer span uses padding-bottom to give descenders room so overflow-hidden
 * doesn't clip them.
 */
export function HeroHeadline({ text, className, as = "h1" }: Props) {
  const Tag = as === "h1" ? motion.h1 : motion.h2;
  const words = text.split(" ");

  return (
    <Tag
      className={cn(
        "font-extrabold tracking-tight",
        as === "h1"
          ? "text-[clamp(2.5rem,1.4rem+5.5vw,5rem)] leading-[1.05]"
          : "text-[clamp(2rem,1.25rem+4vw,3.5rem)] leading-[1.1]",
        className,
      )}
      variants={heroContainer}
      initial="hidden"
      animate="show"
    >
      {words.map((raw, i) => {
        const isBrand = raw.startsWith("*") && raw.endsWith("*");
        const word = isBrand ? raw.slice(1, -1) : raw;
        return (
          <span
            key={i}
            className="inline-block overflow-hidden pb-[0.18em] align-baseline"
            style={{ marginRight: "0.24em" }}
          >
            <motion.span
              variants={heroWord}
              className={cn(
                "inline-block leading-[1]",
                isBrand && "text-brand",
              )}
            >
              {word}
            </motion.span>
          </span>
        );
      })}
    </Tag>
  );
}
