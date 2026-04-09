import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Users, DollarSign, Clock, Flame, Camera, FileText, ArrowRight, CalendarDays, Zap } from "lucide-react";

interface SubmissionRow {
  id: string;
  created_at: string;
  progress_status: string;
  offered_price: number | null;
  estimated_offer_low: number | null;
  estimated_offer_high: number | null;
  acv_value: number | null;
  photos_uploaded: boolean;
  docs_uploaded: boolean;
  is_hot_lead: boolean;
  lead_source: string;
  status_updated_at: string | null;
}

interface FunnelMetrics {
  sourceBreakdown: { key: string; label: string; count: number; color: string }[];
  todayLeads: number;
  weekLeads: number;
  monthLeads: number;
  prevMonthLeads: number;
  hotLeads: number;
  photosUploaded: number;
  docsUploaded: number;
  stageConversion: { stage: string; count: number; pct: number }[];
  totalOfferedValue: number;
  avgOfferAmount: number;
  pendingDealValue: number;
  closedDealValue: number;
  avgResponseDays: number;
  totalLeads: number;
  completedLeads: number;
  deadLeads: number;
  loading: boolean;
}

const STAGE_LABELS: Record<string, string> = {
  new: "New Lead",
  offer_accepted: "Offer Accepted",
  not_contacted: "Not Contacted",
  inspection_scheduled: "Inspection Sched.",
  inspection_completed: "Inspection Done",
  deal_finalized: "Deal Finalized",
  title_ownership_verified: "Title/Ownership",
  check_request_submitted: "Check Request",
  purchase_complete: "Purchased",
  manager_approval_inspection: "MAI",
};

const FUNNEL_STAGES = [
  "new", "offer_accepted", "inspection_scheduled", "inspection_completed",
  "deal_finalized", "check_request_submitted", "purchase_complete",
];

const SOURCE_CONFIG: { key: string; label: string; color: string; ring: string }[] = [
  { key: "inventory", label: "Off Street Purchase", color: "hsl(210, 70%, 50%)", ring: "hsl(210, 70%, 50%)" },
  { key: "service", label: "Service Drive", color: "hsl(160, 60%, 45%)", ring: "hsl(160, 60%, 45%)" },
  { key: "trade", label: "Trade-In", color: "hsl(280, 60%, 55%)", ring: "hsl(280, 60%, 55%)" },
  { key: "in_store_trade", label: "In-Store Trade", color: "hsl(35, 85%, 55%)", ring: "hsl(35, 85%, 55%)" },
];

const DashboardAnalytics = () => {
  const [metrics, setMetrics] = useState<FunnelMetrics>({
    sourceBreakdown: [],
    todayLeads: 0, weekLeads: 0, monthLeads: 0, prevMonthLeads: 0,
    hotLeads: 0, photosUploaded: 0, docsUploaded: 0,
    stageConversion: [], totalOfferedValue: 0, avgOfferAmount: 0,
    pendingDealValue: 0, closedDealValue: 0, avgResponseDays: 0,
    totalLeads: 0, completedLeads: 0, deadLeads: 0, loading: true,
  });

  useEffect(() => { fetchMetrics(); }, []);

  const fetchMetrics = async () => {
    try {
      const { data: subs } = await supabase
        .from("submissions")
        .select("id, created_at, progress_status, offered_price, estimated_offer_low, estimated_offer_high, acv_value, photos_uploaded, docs_uploaded, is_hot_lead, lead_source, status_updated_at");

      if (!subs) { setMetrics(prev => ({ ...prev, loading: false })); return; }

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      let todayLeads = 0, weekLeads = 0, monthLeads = 0, prevMonthLeads = 0;
      let hotLeads = 0, photosUploaded = 0, docsUploaded = 0;
      let totalOfferedValue = 0, offeredCount = 0;
      let pendingDealValue = 0, closedDealValue = 0;
      let totalResponseDays = 0, responseCount = 0;
      let completedLeads = 0, deadLeads = 0;

      const sourceCounts: Record<string, number> = {};
      const statusCounts: Record<string, number> = {};

      subs.forEach((s: SubmissionRow) => {
        const created = new Date(s.created_at);

        // Source
        const src = s.lead_source || "inventory";
        sourceCounts[src] = (sourceCounts[src] || 0) + 1;

        // Time
        if (created >= todayStart) todayLeads++;
        if (created >= weekStart) weekLeads++;
        if (created >= monthStart) monthLeads++;
        if (created >= prevMonthStart && created <= prevMonthEnd) prevMonthLeads++;

        // Quality
        if (s.is_hot_lead) hotLeads++;
        if (s.photos_uploaded) photosUploaded++;
        if (s.docs_uploaded) docsUploaded++;

        // Status
        const st = s.progress_status || "new";
        statusCounts[st] = (statusCounts[st] || 0) + 1;
        if (st === "purchase_complete") completedLeads++;
        if (st === "dead_lead") deadLeads++;

        // Revenue
        const offerVal = s.offered_price || s.acv_value || 0;
        if (offerVal > 0) {
          totalOfferedValue += offerVal;
          offeredCount++;
          if (st === "purchase_complete") closedDealValue += offerVal;
          else if (st !== "dead_lead") pendingDealValue += offerVal;
        }

        // Response time
        if (s.status_updated_at && st !== "new") {
          const updatedAt = new Date(s.status_updated_at);
          const days = (updatedAt.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          if (days >= 0 && days < 365) { totalResponseDays += days; responseCount++; }
        }
      });

      const total = subs.length;

      // Build source breakdown (include all configured + any unknown sources)
      const sourceBreakdown = SOURCE_CONFIG.map(sc => ({
        key: sc.key,
        label: sc.label,
        count: sourceCounts[sc.key] || 0,
        color: sc.color,
      }));
      // Add any unknown sources
      Object.keys(sourceCounts).forEach(key => {
        if (!SOURCE_CONFIG.find(sc => sc.key === key)) {
          sourceBreakdown.push({ key, label: key, count: sourceCounts[key], color: "hsl(0, 0%, 60%)" });
        }
      });

      const stageConversion = FUNNEL_STAGES.map(stage => {
        const stageIdx = FUNNEL_STAGES.indexOf(stage);
        const reachedCount = subs.filter(s => {
          const sIdx = FUNNEL_STAGES.indexOf(s.progress_status);
          return sIdx >= stageIdx;
        }).length;
        return { stage, count: statusCounts[stage] || 0, pct: total > 0 ? Math.round((reachedCount / total) * 100) : 0 };
      });

      setMetrics({
        sourceBreakdown,
        todayLeads, weekLeads, monthLeads, prevMonthLeads,
        hotLeads, photosUploaded, docsUploaded,
        stageConversion, totalOfferedValue,
        avgOfferAmount: offeredCount > 0 ? Math.round(totalOfferedValue / offeredCount) : 0,
        pendingDealValue, closedDealValue,
        avgResponseDays: responseCount > 0 ? Math.round((totalResponseDays / responseCount) * 10) / 10 : 0,
        totalLeads: total, completedLeads, deadLeads, loading: false,
      });
    } catch (err) {
      console.error("Analytics error:", err);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  };

  if (metrics.loading) {
    return (
      <div className="flex items-center justify-center py-8 gap-3 animate-in fade-in">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground font-medium">Loading analytics…</span>
      </div>
    );
  }

  const monthTrend = metrics.prevMonthLeads > 0
    ? Math.round(((metrics.monthLeads - metrics.prevMonthLeads) / metrics.prevMonthLeads) * 100)
    : metrics.monthLeads > 0 ? 100 : 0;

  const conversionRate = metrics.totalLeads > 0
    ? Math.round((metrics.completedLeads / metrics.totalLeads) * 1000) / 10 : 0;

  const activeDeals = metrics.totalLeads - metrics.completedLeads - metrics.deadLeads;
  const avgDaysInPipeline = metrics.avgResponseDays;

  return (
    <div className="space-y-4">
      {/* Pipeline Overview bar */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Pipeline Overview</h4>
        {/* Stacked pipeline bar */}
        <div className="flex rounded-lg overflow-hidden h-8 bg-muted/30">
          {metrics.stageConversion.map((s, i) => {
            const widthPct = metrics.totalLeads > 0 ? (s.count / metrics.totalLeads) * 100 : 0;
            if (widthPct === 0) return null;
            return (
              <div
                key={s.stage}
                className="relative group flex items-center justify-center transition-all duration-300 hover:brightness-110 cursor-default"
                style={{
                  width: `${Math.max(widthPct, 3)}%`,
                  background: `hsl(${160 + i * 28}, 55%, ${48 - i * 3}%)`,
                }}
                title={`${STAGE_LABELS[s.stage]}: ${s.count} (${s.pct}%)`}
              >
                {widthPct > 8 && (
                  <span className="text-[10px] font-bold text-white drop-shadow-sm">{s.count}</span>
                )}
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
          {metrics.stageConversion.map((s, i) => (
            <div key={s.stage} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: `hsl(${160 + i * 28}, 55%, ${48 - i * 3}%)` }} />
              <span className="text-[10px] text-muted-foreground">{STAGE_LABELS[s.stage]}: {s.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// -- Sub-components --

function KpiCard({ label, value, icon: Icon, color, bg, sub, badge }: {
  label: string; value: string | number; icon: React.ElementType; color: string; bg: string;
  sub?: string; badge?: { value: string; positive: boolean };
}) {
  return (
    <div className="relative overflow-hidden bg-card rounded-xl border border-border p-4 shadow-sm premium-card cursor-default">
      <div className={`absolute inset-0 bg-gradient-to-br ${bg} pointer-events-none`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{label}</span>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-black text-card-foreground tracking-tight">{value}</span>
          {badge && (
            <span className={`text-[10px] font-bold ${badge.positive ? "text-emerald-500" : "text-red-500"} flex items-center gap-0.5`}>
              {badge.positive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {badge.value}
            </span>
          )}
        </div>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function DonutChart({ sources, total }: { sources: { key: string; label: string; count: number; color: string }[]; total: number }) {
  const size = 120;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let offset = 0;
  const segments = sources.filter(s => s.count > 0).map(src => {
    const pct = total > 0 ? src.count / total : 0;
    const dashArray = pct * circumference;
    const dashOffset = -offset * circumference;
    offset += pct;
    return { ...src, dashArray, dashOffset, pct };
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {/* Background ring */}
        <circle cx={center} cy={center} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} opacity={0.3} />
        {/* Segments */}
        {segments.map((seg) => (
          <circle
            key={seg.key}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${seg.dashArray} ${circumference - seg.dashArray}`}
            strokeDashoffset={seg.dashOffset}
            className="transition-all duration-500"
          />
        ))}
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-card-foreground">{total}</span>
        <span className="text-[9px] text-muted-foreground font-medium">Total</span>
      </div>
    </div>
  );
}

function SourceBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-32 shrink-0">{label}</span>
      <div className="flex-1 h-6 bg-muted/30 rounded-full overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
          style={{ width: `${Math.max(pct, 4)}%`, background: color }}
        >
          {pct > 15 && <span className="text-[10px] font-bold text-white drop-shadow-sm">{count}</span>}
        </div>
      </div>
      <span className="text-xs font-bold text-card-foreground w-10 text-right">{pct}%</span>
    </div>
  );
}

function QualityPill({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className={`flex flex-col items-center gap-1 rounded-lg p-2 ${color.split(" ")[1]}`}>
      <Icon className={`w-4 h-4 ${color.split(" ")[0]}`} />
      <span className="text-lg font-black text-card-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

export default DashboardAnalytics;
