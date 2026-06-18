import { HeroSection } from "@/components/marketing/sections/hero";
import { ProblemSection } from "@/components/marketing/sections/problem";
import { HowItWorksSection } from "@/components/marketing/sections/how-it-works";
import { FeaturesSection } from "@/components/marketing/sections/features";
import { ComparisonSection } from "@/components/marketing/sections/comparison";
import { ForSchoolsSection } from "@/components/marketing/sections/for-schools";
import { ImpactSection } from "@/components/marketing/sections/impact";
import { PricingPreviewSection } from "@/components/marketing/sections/pricing-preview";
import { FaqSection } from "@/components/marketing/sections/faq";
import { CtaSection } from "@/components/marketing/sections/cta";

export default function LandingPage() {
  return (
    <main>
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <FeaturesSection />
      <ComparisonSection />
      <ForSchoolsSection />
      <ImpactSection />
      <PricingPreviewSection />
      <FaqSection />
      <CtaSection />
    </main>
  );
}
