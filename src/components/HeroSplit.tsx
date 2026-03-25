import { Check, Shield } from "lucide-react";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import SellCarForm from "@/components/SellCarForm";

const HeroSplit = () => {
  const { config } = useSiteConfig();

  const benefits = [
    { label: "Faster", desc: "Cash in 24 hrs" },
    { label: "Safer", desc: "No strangers" },
    { label: "Easy", desc: "We handle paperwork" },
    { label: "Private", desc: "Info never shared" },
  ];

  return (
    <section className="bg-gradient-to-b from-primary to-[hsl(210,100%,36%)] text-primary-foreground relative">
      <div className="max-w-6xl mx-auto px-5 py-10 lg:py-16">
        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-12">
          {/* Left: text content */}
          <div className="lg:flex-1 lg:pt-8 text-center lg:text-left mb-8 lg:mb-0">
            {/* Price Guarantee Badge */}
            <div className="inline-flex items-center gap-2 bg-success/20 border border-success/40 rounded-full px-4 py-1 mb-4">
              <Shield className="w-4 h-4 text-success fill-success/30" />
              <span className="text-sm font-bold tracking-wide text-success-foreground">
                {config.price_guarantee_days}-DAY PRICE GUARANTEE
              </span>
            </div>

            <h1 className="text-[28px] md:text-[36px] lg:text-[44px] font-extrabold tracking-wide leading-tight mb-3 uppercase">
              {config.hero_headline || "Sell Your Car\nThe Easy Way"}
            </h1>
            <p className="text-base lg:text-lg font-normal opacity-95 mb-6 leading-relaxed max-w-lg lg:max-w-none">
              {config.hero_subtext || "Get a top-dollar cash offer in 2 minutes. No haggling, no stress."}
            </p>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-w-md lg:max-w-lg mx-auto lg:mx-0">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-success flex-shrink-0 stroke-[3]" />
                  <span className="text-[13px] md:text-[14px] font-medium whitespace-nowrap">
                    <strong>{b.label}:</strong> {b.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: form */}
          <div className="lg:w-[440px] lg:flex-shrink-0">
            <SellCarForm variant="split" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSplit;
