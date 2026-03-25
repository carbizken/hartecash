import { useSiteConfig } from "@/hooks/useSiteConfig";
import SellCarForm from "@/components/SellCarForm";

interface HeroOffsetProps {
  side: "left" | "right";
}

const HeroOffset = ({ side }: HeroOffsetProps) => {
  const { config } = useSiteConfig();

  const textContent = (
    <div className="lg:flex-1 lg:pt-12 text-center lg:text-left mb-8 lg:mb-0">
      <h1 className="text-[28px] md:text-[36px] lg:text-[48px] font-extrabold tracking-wide leading-tight mb-4 uppercase">
        {config.hero_headline || "Sell Your Car\nThe Easy Way"}
      </h1>
      <p className="text-base lg:text-lg font-normal opacity-95 leading-relaxed max-w-lg lg:max-w-none">
        {config.hero_subtext || "Get a top-dollar cash offer in 2 minutes. No haggling, no stress."}
      </p>
    </div>
  );

  const formContent = (
    <div className="lg:w-[460px] lg:flex-shrink-0">
      <SellCarForm variant="split" />
    </div>
  );

  return (
    <section className="bg-gradient-to-b from-primary to-[hsl(210,100%,36%)] text-primary-foreground relative">
      <div className="max-w-6xl mx-auto px-5 py-12 lg:py-20">
        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-16">
          {side === "right" ? (
            <>
              {textContent}
              {formContent}
            </>
          ) : (
            <>
              {formContent}
              {textContent}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroOffset;
