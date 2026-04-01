import { lazy, Suspense } from "react";
import SEO from "@/components/SEO";
import { LocalBusinessJsonLd, FAQPageJsonLd, HowToJsonLd } from "@/components/JsonLd";
import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import SellCarForm from "@/components/SellCarForm";
import HowItWorks from "@/components/HowItWorks";
import ValueProps from "@/components/ValueProps";
import TrustBadges from "@/components/TrustBadges";
import CompetitorComparison from "@/components/CompetitorComparison";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import CTABanner from "@/components/CTABanner";
import SiteFooter from "@/components/SiteFooter";
import AboutBlurb from "@/components/AboutBlurb";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { useTenant } from "@/contexts/TenantContext";
import HeroOffset from "@/components/HeroOffset";

const PlatformLanding = lazy(() => import("./PlatformLanding"));

/**
 * Returns true when we're on the platform domain (autocurb.io)
 * rather than a tenant's branded domain.
 */
function isPlatformDomain(): boolean {
  const h = window.location.hostname;
  return h === "autocurb.io" || h === "www.autocurb.io";
}

const Index = () => {
  const { tenant } = useTenant();
  const { config } = useSiteConfig();
  const layout = config.hero_layout || "offset_right";

  // If we're on autocurb.io (platform domain) and the tenant is the fallback default,
  // show the SaaS platform landing page instead of a dealer page.
  if (isPlatformDomain() && tenant.dealership_id === "default") {
    return (
      <Suspense fallback={null}>
        <PlatformLanding />
      </Suspense>
    );
  }

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
      <SiteHeader />
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
        <HowItWorks />
        <TrustBadges />
        <CompetitorComparison />
        <ValueProps />
        <Testimonials />
        <FAQ />
        <CTABanner />
        
      </main>
      <SiteFooter />
    </div>
  );
};

export default Index;
