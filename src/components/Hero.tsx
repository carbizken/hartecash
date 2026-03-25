import { Check, Shield } from "lucide-react";
import { useSiteConfig } from "@/hooks/useSiteConfig";

const Hero = () => {
  const { config } = useSiteConfig();

  const benefits = [
    { label: "Faster", desc: "Cash in 24 hrs" },
    { label: "Safer", desc: "No strangers" },
    { label: "Easy", desc: "We handle paperwork" },
    { label: "Private", desc: "Info never shared" },
  ];

  return (
    <section className="bg-gradient-to-b from-primary to-[hsl(210,100%,36%)] text-primary-foreground px-5 py-4 lg:py-5 pb-5 lg:pb-6 text-center relative">
      <div className="max-w-4xl mx-auto">
        {/* Price Guarantee Badge */}
        <div className="inline-flex items-center gap-2 bg-success/20 border border-success/40 rounded-full px-4 py-1 mb-2">
          <Shield className="w-4 h-4 text-success fill-success/30" />
          <span className="text-sm font-bold tracking-wide text-success-foreground">
            {config.price_guarantee_days}-DAY PRICE GUARANTEE
          </span>
        </div>

        <h1 className="text-[24px] md:text-[30px] lg:text-[38px] font-extrabold tracking-wide leading-tight mb-1.5 uppercase">
          {config.hero_headline || "Sell Your Car\nThe Easy Way"}
        </h1>
        <p className="text-base lg:text-lg font-normal opacity-95 mb-3 lg:mb-4 leading-relaxed max-w-xl mx-auto">
          {config.hero_subtext || "Get a top-dollar cash offer in 2 minutes. No haggling, no stress."}
        </p>

        <div className="hidden lg:flex items-center justify-center gap-5 mb-3">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-success flex-shrink-0 stroke-[3]" />
              <span className="text-[13px] font-medium whitespace-nowrap">
                <strong>{b.label}:</strong> {b.desc}
              </span>
            </div>
          ))}
        </div>

        <div className="lg:hidden flex flex-wrap justify-center gap-x-5 gap-y-1 mb-3">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-success flex-shrink-0 stroke-[3]" />
              <span className="text-[13px] font-medium whitespace-nowrap">
                <strong>{b.label}:</strong> {b.desc}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Hero;
