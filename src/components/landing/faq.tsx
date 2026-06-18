import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollReveal } from "./scroll-reveal";

const FAQS = [
  {
    q: "Is Mentoria Hub really free?",
    a: "Yes. Every student gets full access to the opportunity catalog, one complete roadmap, AI Mentor (20 questions per month), and 10 foundation courses — completely free, no credit card required. Extended plans for schools are available on request.",
  },
  {
    q: "Which grades is it designed for?",
    a: "Grades 8 through 11. This is the window when the most impactful academic opportunities open up — olympiads, scholarships, research programmes, and university preparation. We've designed every feature specifically for this age range.",
  },
  {
    q: "Does it work for students outside Kazakhstan?",
    a: "Yes. While Mentoria Hub has deep coverage of KZ-specific opportunities (NIS, Bolashak, NUOS, etc.), the catalog also includes international olympiads, global scholarships, and programmes open to students from any country. The roadmap works regardless of your location.",
  },
  {
    q: "How is my personal data protected?",
    a: "We follow SOC 2-grade security practices and treat student data with the highest standard of care — especially important since many of our users are minors. We do not sell or share your data with third parties. Full details are in our Privacy Policy.",
  },
  {
    q: "Do I need a mentor already to use Mentoria Hub?",
    a: "Not at all. Mentoria Hub is designed to be useful from day one without any prior mentoring relationship. The AI Mentor provides guidance based on your roadmap, and the platform itself replaces the need to find and pay for a human consultant just to know what steps to take.",
  },
  {
    q: "How does the roadmap get generated? Is it really personalised?",
    a: "Yes — it's built from your specific inputs: your grade, academic strengths, career interests, target schools, and timeline. The AI then matches you against the full opportunity catalog, sequences the steps by priority and deadline, and produces a plan tailored to you. It updates as you progress.",
  },
  {
    q: "What if I don't know what I want to study yet?",
    a: "That's completely fine — and very common. Mentoria Hub has an exploration mode where you can browse broadly, take interest assessments, and discover categories and opportunities you hadn't considered. The roadmap can be refined as your direction becomes clearer.",
  },
  {
    q: "How is Mentoria Hub different from a regular search or Telegram channel?",
    a: "A Telegram channel gives you a raw feed — unfiltered, unranked, unorganised. Mentoria Hub matches every opportunity to your specific profile, tells you why it fits, sequences it in a plan with deadlines, teaches you the skills you need, and guides you through the application. It's the difference between a map and a pile of road signs.",
  },
];

export function FAQ() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-black text-fg sm:text-4xl">
            Questions we hear a lot.
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.1} className="mt-12">
          <Accordion className="divide-y divide-border rounded-2xl border border-border bg-surface shadow-card">
            {FAQS.map((faq, i) => (
              <AccordionItem key={faq.q} value={`faq-${i}`} className="px-6">
                <AccordionTrigger className="py-5 text-left text-sm font-bold text-fg hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="pb-5 text-sm font-medium leading-relaxed text-fg-muted">
                    {faq.a}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollReveal>
      </div>
    </section>
  );
}
