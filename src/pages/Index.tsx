import { lazy, Suspense, Component, ReactNode } from "react";
import SEO from "@/components/SEO";
import { LocalBusinessJsonLd, FAQPageJsonLd, HowToJsonLd } from "@/components/JsonLd";
import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import SellCarForm from "@/components/SellCarForm";
import SiteFooter from "@/components/SiteFooter";

import { useSiteConfig } from "@/hooks/useSiteConfig";
import HeroOffset from "@/components/HeroOffset";
import BackToTop from "@/components/BackToTop";
import { useEmbedMode } from "@/hooks/useEmbedMode";

// Lazy-load below-fold sections for smaller initial bundle
const HowItWorks = lazy(() => import("@/components/HowItWorks"));
const TrustBadges = lazy(() => import("@/components/TrustBadges"));
const CompetitorComparison = lazy(() => import("@/components/CompetitorComparison"));
const ValueProps = lazy(() => import("@/components/ValueProps"));
const Testimonials = lazy(() => import("@/components/Testimonials"));
const FAQ = lazy(() => import("@/components/FAQ"));
const CTABanner = lazy(() => import("@/components/CTABanner"));
const ReferralBanner = lazy(() => import("@/components/ReferralBanner"));

// ErrorBoundary prevents lazy chunk failures from crashing the whole page
class SectionErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// Lightweight skeleton for lazy sections
const SectionSkeleton = () => (
  <div className="w-full py-12 flex justify-center">
    <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
  </div>
);

const Index = () => {
  const { config } = useSiteConfig();
  const embed = useEmbedMode();
  const layout = config.hero_layout || "offset_right";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`Sell Your Car - Get Cash Offer in 2 Minutes | ${config.dealership_name}`}
        description={`Get a top-dollar cash offer for your car in 2 minutes. Free pickup, no obligation. ${config.dealership_name}.`}
        path="/"
      />
      <LocalBusinessJsonLd />
      <FAQPageJsonLd />
      <HowToJsonLd />
      {!embed && <SiteHeader />}
        <main>
          {layout === "offset_right" ? (
            <HeroOffset side="right" />
          ) : layout === "offset_left" ? (
            <HeroOffset side="left" />
          ) : (
            <>
              <Hero />
              <SellCarForm />
            </>
          )}
          <SectionErrorBoundary>
            <Suspense fallback={<SectionSkeleton />}>
              <HowItWorks />
            </Suspense>
          </SectionErrorBoundary>
          <SectionErrorBoundary>
            <Suspense fallback={<SectionSkeleton />}>
              <TrustBadges />
            </Suspense>
          </SectionErrorBoundary>
          <SectionErrorBoundary>
            <Suspense fallback={null}>
              <CompetitorComparison />
            </Suspense>
          </SectionErrorBoundary>
          <SectionErrorBoundary>
            <Suspense fallback={<SectionSkeleton />}>
              <ValueProps />
            </Suspense>
          </SectionErrorBoundary>
          <SectionErrorBoundary>
            <Suspense fallback={<SectionSkeleton />}>
              <Testimonials />
            </Suspense>
          </SectionErrorBoundary>
          <SectionErrorBoundary>
            <Suspense fallback={<SectionSkeleton />}>
              <FAQ />
            </Suspense>
          </SectionErrorBoundary>
          <SectionErrorBoundary>
            <Suspense fallback={null}>
              <ReferralBanner />
            </Suspense>
          </SectionErrorBoundary>
          <SectionErrorBoundary>
            <Suspense fallback={null}>
              <CTABanner />
            </Suspense>
          </SectionErrorBoundary>
        </main>
      {!embed && <SiteFooter />}
      {!embed && <BackToTop />}
    </div>
  );
};

export default Index;
