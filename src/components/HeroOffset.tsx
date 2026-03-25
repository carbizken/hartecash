import { Check, Shield, Star } from "lucide-react";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import SellCarForm from "@/components/SellCarForm";
import { motion } from "framer-motion";

interface HeroOffsetProps {
  side: "left" | "right";
}

const HeroOffset = ({ side }: HeroOffsetProps) => {
  const { config } = useSiteConfig();

  const benefits = [
    "Faster: Get cash in 24 hours, not weeks of meetups",
    "More Convenient: One visit, we handle all paperwork",
    "Safer: No strangers at your home or getting your personal info",
    "Privacy Protected: We never share your address, name, or phone number",
  ];

  const textContent = (
    <motion.div
      className="lg:flex-1 lg:pt-8 text-center lg:text-left mb-8 lg:mb-0"
      initial={{ opacity: 0, x: side === "right" ? -40 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <h1 className="text-[28px] md:text-[36px] lg:text-[48px] font-extrabold tracking-wide leading-tight mb-3 uppercase">
        {config.hero_headline || "Sell Your Car\nThe Easy Way"}
      </h1>
      <p className="text-lg lg:text-xl font-medium opacity-95 mb-6 leading-relaxed max-w-lg lg:max-w-none">
        {config.hero_subtext || "Get a top-dollar cash offer in 2 minutes. No haggling, no stress."}
      </p>

      <div className="space-y-2.5 max-w-lg mx-auto lg:mx-0">
        {benefits.map((b, i) => {
          const colonIdx = b.indexOf(":");
          const label = b.substring(0, colonIdx);
          const desc = b.substring(colonIdx + 1).trim();
          return (
            <div key={i} className="flex items-start gap-2">
              <Check className="w-5 h-5 text-success flex-shrink-0 stroke-[3] mt-0.5" />
              <span className="text-[14px] md:text-[15px] font-medium leading-snug">
                <strong>{label}:</strong> {desc}
              </span>
            </div>
          );
        })}
      </div>

      {/* Star rating */}
      <div className="flex items-center gap-3 mt-6 justify-center lg:justify-start">
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <span className="text-lg font-bold">{config.stats_rating || "4.9"}</span>
        <span className="text-xs opacity-80">{config.stats_reviews_count || "2,400+"} reviews</span>
      </div>
    </motion.div>
  );

  const formContent = (
    <motion.div
      className="lg:w-[460px] lg:flex-shrink-0"
      initial={{ opacity: 0, x: side === "right" ? 40 : -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
    >
      <div className="lg:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] lg:rounded-2xl">
        <SellCarForm variant="split" />
      </div>
    </motion.div>
  );

  return (
    <section className="bg-gradient-to-b from-primary to-[hsl(210,100%,36%)] text-primary-foreground relative overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: "radial-gradient(circle at 20% 50%, hsl(0 0% 100%) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      <div className="max-w-6xl mx-auto px-5 py-12 lg:py-20 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-12">
          {/* Vertical divider - desktop only */}
          {side === "right" ? (
            <>
              {textContent}
              <div className="hidden lg:block w-px self-stretch bg-primary-foreground/15 mx-2" />
              {formContent}
            </>
          ) : (
            <>
              {formContent}
              <div className="hidden lg:block w-px self-stretch bg-primary-foreground/15 mx-2" />
              {textContent}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroOffset;
