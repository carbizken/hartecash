import { TrendingUp } from "lucide-react";
import { useMemo } from "react";
import AnimatedCounter from "@/components/AnimatedCounter";
import type { FormData, BBVehicle } from "./types";

interface Props {
  formData: FormData;
  bbVehicle?: BBVehicle | null;
}

const conditionMultipliers: Record<string, number> = {
  excellent: 1.0,
  very_good: 0.92,
  good: 0.84,
  fair: 0.72,
};

const LiveOfferPreview = ({ formData, bbVehicle }: Props) => {
  const range = useMemo(() => {
    if (!bbVehicle?.tradein?.avg) return null;

    const base = bbVehicle.tradein.avg;
    const condMult = conditionMultipliers[formData.overallCondition] || 0.88;
    let adjusted = base * condMult;

    // Small deductions for reported issues
    const issueCount = [
      ...formData.exteriorDamage.filter(v => v !== "none"),
      ...formData.interiorDamage.filter(v => v !== "none"),
      ...formData.techIssues.filter(v => v !== "none"),
      ...formData.engineIssues.filter(v => v !== "none"),
      ...formData.mechanicalIssues.filter(v => v !== "none"),
    ].length;

    adjusted -= issueCount * 150;

    if (formData.drivable === "Not drivable") adjusted *= 0.7;
    if (formData.windshieldDamage === "Major cracks or chips") adjusted -= 350;

    const low = Math.max(Math.round((adjusted * 0.92) / 100) * 100, 500);
    const high = Math.round((adjusted * 1.04) / 100) * 100;

    return { low, high };
  }, [formData, bbVehicle]);

  if (!range) return null;

  return (
    <div className="bg-success/10 border border-success/25 rounded-xl p-4 mb-4 text-center">
      <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-success mb-1">
        <TrendingUp className="w-3.5 h-3.5" />
        Estimated Offer Range
      </div>
      <div className="text-2xl font-extrabold text-card-foreground tracking-tight">
        <AnimatedCounter target={range.low} prefix="$" duration={600} />
        {" – "}
        <AnimatedCounter target={range.high} prefix="$" duration={600} />
      </div>
      <p className="text-[11px] text-muted-foreground mt-1">Updates as you answer · final offer may vary</p>
    </div>
  );
};

export default LiveOfferPreview;
