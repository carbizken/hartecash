import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp, TrendingDown, Minus, Activity, BarChart2, Car, AlertTriangle, CheckCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { RetailStats } from "@/components/admin/RetailMarketPanel";

interface RecentSale {
  id: string;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  acv_value: number | null;
  offered_price: number | null;
  appraisal_finalized_at: string | null;
  overall_condition: string | null;
  mileage: string | null;
}

interface MarketPulseCardProps {
  retailMarketStats: RetailStats | null;
  dealershipId: string;
  bbClassName?: string | null;
  vehicleYear?: string | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  condition?: string;
  mileage?: string | null;
}

function fmt(val: number | null | undefined, fallback = "—") {
  if (val == null || val === 0) return fallback;
  return `$${Math.round(val).toLocaleString()}`;
}

function daysAgo(isoDate: string | null) {
  if (!isoDate) return null;
  const diff = (Date.now() - new Date(isoDate).getTime()) / 86_400_000;
  if (diff < 1) return "Today";
  if (diff < 2) return "Yesterday";
  return `${Math.floor(diff)}d ago`;
}

function mdsSignal(mds: number | null) {
  if (mds == null) return { label: "Loading market data…", color: "text-muted-foreground", bg: "bg-muted/30 border-border/40", icon: Minus };
  if (mds <= 30) return { label: "Fast Mover", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/25", icon: TrendingUp };
  if (mds <= 60) return { label: "Normal Pace", color: "text-primary", bg: "bg-primary/10 border-primary/25", icon: Activity };
  return { label: "Slow Mover", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/25", icon: TrendingDown };
}

function StatPill({ label, value, sub, color = "text-card-foreground", loading }: {
  label: string; value: string; sub?: string; color?: string; loading?: boolean;
}) {
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-muted/30 min-w-[90px]">
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      {loading ? (
        <Skeleton className="h-5 w-14 mt-1" />
      ) : (
        <span className={`text-lg font-bold leading-tight ${color}`}>{value}</span>
      )}
      {sub && !loading && <span className="text-[9px] text-muted-foreground">{sub}</span>}
    </div>
  );
}

const COND_LABEL: Record<string, string> = {
  excellent: "Excellent", very_good: "Very Good", good: "Good", fair: "Fair",
};

export default function MarketPulseCard({
  retailMarketStats, dealershipId, bbClassName, vehicleYear, vehicleMake, vehicleModel,
}: MarketPulseCardProps) {
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const statsLoading = retailMarketStats == null;

  useEffect(() => {
    if (!dealershipId || !bbClassName) { setSalesLoading(false); return; }
    (async () => {
      setSalesLoading(true);
      const { data } = await supabase
        .from("submissions")
        .select("id, vehicle_year, vehicle_make, vehicle_model, acv_value, offered_price, appraisal_finalized_at, overall_condition, mileage")
        .eq("dealership_id", dealershipId)
        .eq("appraisal_finalized", true)
        .eq("bb_class_name", bbClassName)
        .order("appraisal_finalized_at", { ascending: false })
        .limit(5);
      setRecentSales((data as RecentSale[]) || []);
      setSalesLoading(false);
    })();
  }, [dealershipId, bbClassName]);

  const mds = retailMarketStats?.market_days_supply ?? null;
  const signal = mdsSignal(mds);
  const SignalIcon = signal.icon;

  const activeMean = retailMarketStats?.active?.mean_price ?? null;
  const soldMean = retailMarketStats?.sold?.mean_price ?? null;
  const activeCount = retailMarketStats?.active?.vehicle_count ?? null;
  const soldCount = retailMarketStats?.sold?.vehicle_count ?? null;
  const meanDaysToTurn = retailMarketStats?.mean_days_to_turn ?? null;

  const spread = activeMean && soldMean ? activeMean - soldMean : null;
  const spreadPct = spread && activeMean ? ((spread / activeMean) * 100).toFixed(1) : null;

  const storeAcvValues = recentSales.map((s) => s.acv_value).filter((v): v is number => v != null && v > 0);
  const storeAvgAcv = storeAcvValues.length > 0
    ? Math.round(storeAcvValues.reduce((a, b) => a + b, 0) / storeAcvValues.length)
    : null;

  return (
    <div className="mb-5 rounded-xl border-2 border-border/60 bg-card shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Market Pulse
          </span>
          <span className="text-xs text-muted-foreground">
            {[vehicleYear, vehicleMake, vehicleModel].filter(Boolean).join(" ")}
            {bbClassName ? ` · ${bbClassName}` : ""}
          </span>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${signal.bg} ${signal.color}`}>
          <SignalIcon className="w-3.5 h-3.5" />
          {statsLoading ? (
            <Skeleton className="h-3.5 w-20" />
          ) : (
            <span>{signal.label}{mds != null ? ` · ${mds}d MDS` : ""}</span>
          )}
        </div>
      </div>

      {/* Stat Strip */}
      <div className="px-4 pb-3">
        <div className="flex flex-wrap gap-2">
          <StatPill label="Active" value={activeCount != null ? String(activeCount) : "—"} sub="listings" loading={statsLoading} />
          <StatPill label="Avg Ask" value={fmt(activeMean)} loading={statsLoading} />
          <StatPill label="Avg Sold" value={fmt(soldMean)} sub="90-day" loading={statsLoading} />
          <StatPill
            label="Ask→Sold"
            value={spread != null ? `${spread > 0 ? "-" : "+"}${fmt(Math.abs(spread))}` : "—"}
            sub={spreadPct ? `${spreadPct}% discount` : undefined}
            loading={statsLoading}
            color={spread == null ? "text-muted-foreground" : spread > 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}
          />
          <StatPill label="Avg Turn" value={meanDaysToTurn != null ? `${Math.round(meanDaysToTurn)}d` : "—"} loading={statsLoading} />
          <StatPill
            label="Your Avg ACV"
            value={storeAvgAcv != null ? fmt(storeAvgAcv) : "—"}
            sub={storeAcvValues.length > 0 ? `${storeAcvValues.length} finalized deal${storeAcvValues.length !== 1 ? "s" : ""}` : "no history yet"}
            loading={salesLoading}
            color={storeAvgAcv ? "text-primary" : "text-muted-foreground"}
          />
        </div>

        {/* Recent Store Sales */}
        <div className="mt-3 rounded-lg border border-border/50 bg-muted/10">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
            <div className="flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Your Recent Finalized Deals — Same Class
              </span>
            </div>
            {bbClassName && (
              <span className="text-[9px] bg-muted/50 px-2 py-0.5 rounded-full text-muted-foreground font-medium">{bbClassName}</span>
            )}
          </div>

          {salesLoading ? (
            <div className="p-3 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : recentSales.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              <Car className="w-5 h-5 mx-auto mb-1.5 opacity-40" />
              No finalized deals on record for this vehicle class yet. This table fills automatically as appraisals are completed.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[9px] uppercase tracking-wider text-muted-foreground border-b border-border/30">
                    <th className="text-left px-3 py-1.5 font-medium">Vehicle</th>
                    <th className="text-left px-3 py-1.5 font-medium">Mileage</th>
                    <th className="text-left px-3 py-1.5 font-medium">Condition</th>
                    <th className="text-right px-3 py-1.5 font-medium">ACV</th>
                    <th className="text-right px-3 py-1.5 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale) => {
                    const condColor =
                      sale.overall_condition === "excellent" ? "text-emerald-600 dark:text-emerald-400"
                        : sale.overall_condition === "very_good" ? "text-primary"
                        : sale.overall_condition === "fair" ? "text-amber-600"
                        : "text-card-foreground";
                    return (
                      <tr key={sale.id} className="border-b border-border/20 last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-1.5 font-medium text-card-foreground">
                          {[sale.vehicle_year, sale.vehicle_make, sale.vehicle_model].filter(Boolean).join(" ") || "—"}
                        </td>
                        <td className="px-3 py-1.5 text-muted-foreground">
                          {sale.mileage ? `${Number(sale.mileage).toLocaleString()} mi` : "—"}
                        </td>
                        <td className={`px-3 py-1.5 font-medium ${condColor}`}>
                          {COND_LABEL[sale.overall_condition || ""] || sale.overall_condition || "—"}
                        </td>
                        <td className="px-3 py-1.5 text-right font-bold text-card-foreground">{fmt(sale.acv_value)}</td>
                        <td className="px-3 py-1.5 text-right text-muted-foreground">{daysAgo(sale.appraisal_finalized_at)}</td>
                      </tr>
                    );
                  })}
                  {storeAvgAcv != null && (
                    <tr className="bg-muted/30 border-t border-border/40">
                      <td colSpan={3} className="px-3 py-1.5 font-semibold text-muted-foreground">Store Average ACV</td>
                      <td className="px-3 py-1.5 text-right font-bold text-primary">{fmt(storeAvgAcv)}</td>
                      <td className="px-3 py-1.5 text-right text-muted-foreground text-[9px]">{storeAcvValues.length} deals</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Auto-insight footer */}
        {!statsLoading && soldMean != null && storeAvgAcv != null && (
          <div className="mt-2.5 flex items-start gap-2 px-3 py-2 rounded-lg border border-border/30 bg-muted/10 text-xs">
            {storeAvgAcv <= soldMean ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                  Your store's avg ACV of <span className="font-bold text-emerald-600 dark:text-emerald-400">{fmt(storeAvgAcv)}</span> is{" "}
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{fmt(soldMean - storeAvgAcv)} below</span> the 90-day market sold average ({fmt(soldMean)}). You're buying right on this class.
                </p>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                  Your store's avg ACV of <span className="font-bold text-amber-600">{fmt(storeAvgAcv)}</span> is{" "}
                  <span className="font-bold text-destructive">{fmt(storeAvgAcv - soldMean)} above</span> the 90-day market sold average ({fmt(soldMean)}). Watch your margins on this class.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
