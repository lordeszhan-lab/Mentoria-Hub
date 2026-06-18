"use client";

import { motion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ease, dur } from "@/lib/motion/tokens";

/**
 * FAQ. Mirrors Seobloom's accordion section, with Mentoria's real-objection
 * questions from the PDF.
 */

const FAQ = [
  {
    q: "Is Mentoria Hub really free?",
    a: "Yes. Every student gets full access to the opportunity catalog, one personal roadmap, foundation courses, deadline reminders, and the AI mentor (20 questions a month) — free, with no credit card required. Schools and programmes can request extended plans.",
  },
  {
    q: "Which grades is it designed for?",
    a: "Grades 8 through 11. The roadmap engine sequences a multi-year plan from your current grade all the way to university admission, so the earlier you start, the more it can do for you.",
  },
  {
    q: "Does it work for students outside Kazakhstan?",
    a: "Yes. While we have deep coverage of Kazakhstani opportunities, the catalog includes international olympiads, scholarships, and programs, and the platform supports students across KZ, RU, UZ, TR, and beyond.",
  },
  {
    q: "How is my personal data protected?",
    a: "Your data is encrypted in transit and at rest, with privacy-by-design for minors. We never sell your data, and we're transparent about how it's used. A full data-processing agreement is available for schools and partners.",
  },
  {
    q: "Do I need a mentor already to use Mentoria Hub?",
    a: "No. The AI mentor and the roadmap do the guiding — they read your profile, know your goals, and tell you what to do next. If you already work with a school counsellor, Mentoria makes their job easier, not redundant.",
  },
  {
    q: "How does the roadmap get generated? Is it really personalised?",
    a: "You answer a short set of questions about your grade, interests, goal, and strengths. Mentoria then builds a plan from real catalog opportunities and courses — sequenced by deadline and impact for your specific goal. Every step links to a real application, course, or action, and the plan adapts as you progress.",
  },
  {
    q: "What if I don't know what I want to study yet?",
    a: "That's fine — many students don't. Start with your interests and current strengths, and the roadmap will surface a range of opportunities to explore. As your direction sharpens, regenerate your roadmap and it re-plans around your new goal.",
  },
  {
    q: "How is Mentoria Hub different from a regular search or Telegram channel?",
    a: "A search or channel gives you a scattered, undated list you have to sift through yourself. Mentoria scores every opportunity against your profile, sequences the relevant ones into a dated plan, ties courses to them, reminds you before deadlines, and gives you a mentor that knows your whole picture. It's the plan, not the pile.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="border-t bg-muted/10 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: dur.slow, ease: ease.out }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            FAQ
          </p>
          <h2 className="mt-3 text-[clamp(1.75rem,1.125rem+3.125vw,3rem)] font-extrabold leading-[1.1] tracking-tight">
            Questions we hear a lot.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: dur.slow, ease: ease.out, delay: 0.1 }}
          className="mt-12"
        >
          <Accordion className="w-full">
            {FAQ.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border/60">
                <AccordionTrigger className="py-5 text-left text-[15px] font-medium hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-[14px] leading-relaxed text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
