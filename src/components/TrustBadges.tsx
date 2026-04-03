import AnimatedCounter from "./AnimatedCounter";
import { ShieldCheck, Award, Users } from "lucide-react";
import { useSiteConfig } from "@/hooks/useSiteConfig";

const TrustBadges = () => {
  const { config } = useSiteConfig();

  // Parse numeric values from config strings for animated counters
  const carsNum = parseInt((config.stats_cars_purchased || "2400").replace(/[^0-9]/g, "")) || 2400;
  const carsSuffix = (config.stats_cars_purchased || "").replace(/[0-9,]/g, "").trim() || "+";
  const yearsNum = parseInt((config.stats_years_in_business || "72").replace(/[^0-9]/g, "")) || 72;
  const yearsSuffix = (config.stats_years_in_business || "").replace(/[0-9,]/g, "").trim() || " yrs";
  const ratingVal = parseFloat(config.stats_rating || "4.9") || 4.9;

  const stats = [
    { icon: Users, value: carsNum, suffix: carsSuffix, label: "Cars Purchased" },
    { icon: Award, value: yearsNum, suffix: yearsSuffix, label: "In Business" },
    { icon: ShieldCheck, value: ratingVal, suffix: "★", label: "Rating" },
  ];

  return (
    <section id="trust" className="py-10 px-5 bg-primary">
      <div className="max-w-[600px] lg:max-w-4xl mx-auto grid grid-cols-3 gap-4 text-center">
        {stats.map((s, i) => (
          <div key={i} className="text-primary-foreground">
            <s.icon className="w-6 h-6 lg:w-8 lg:h-8 mx-auto mb-2 opacity-80" />
            <p className="text-2xl md:text-3xl lg:text-4xl font-extrabold">
              {s.value === ratingVal && s.label === "Rating" ? (
                <span>{s.value}{s.suffix}</span>
              ) : (
                <AnimatedCounter target={s.value} suffix={s.suffix} />
              )}
            </p>
            <p className="text-xs lg:text-sm opacity-70 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrustBadges;
