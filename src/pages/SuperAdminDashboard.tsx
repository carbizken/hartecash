import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock,
  XCircle,
  Car,
} from "lucide-react";
import { toast } from "sonner";

interface TenantRow {
  dealership_id: string;
  slug: string;
  display_name: string;
  is_active: boolean;
  custom_domain: string | null;
  created_at: string;
}

interface DealerAccount {
  dealership_id: string;
  plan_tier: string;
  plan_cost: number;
  onboarding_status: string;
  start_date: string | null;
  billing_date: number | null;
}

interface SubmissionAgg {
  dealership_id: string;
  total: number;
  with_offer: number;
  purchased: number;
  avg_offer: number | null;
}

interface PlatformMetrics {
  totalTenants: number;
  activeTenants: number;
  totalSubmissions: number;
  totalPurchased: number;
  mrr: number;
  avgConversion: number;
}

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [accounts, setAccounts] = useState<DealerAccount[]>([]);
  const [submissionAggs, setSubmissionAggs] = useState<SubmissionAgg[]>([]);
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    totalTenants: 0,
    activeTenants: 0,
    totalSubmissions: 0,
    totalPurchased: 0,
    mrr: 0,
    avgConversion: 0,
  });

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/admin/login");
        return;
      }

      // Only platform admin (dealership_id = 'default' + admin role) can access
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role, dealership_id")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .eq("dealership_id", "default")
        .maybeSingle();

      if (!roleData) {
        toast.error("You don't have super-admin access.");
        navigate("/admin");
        return;
      }

      setAuthorized(true);
      await loadData();
    };

    init();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch all tenants
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("dealership_id, slug, display_name, is_active, custom_domain, created_at")
        .order("created_at", { ascending: true });

      // Fetch dealer accounts
      const { data: accountData } = await supabase
        .from("dealer_accounts")
        .select("dealership_id, plan_tier, plan_cost, onboarding_status, start_date, billing_date");

      // Fetch submission aggregates per dealership
      const { data: subData } = await supabase
        .from("submissions")
        .select("dealership_id, progress_status, offered_price");

      const t = (tenantData || []) as TenantRow[];
      const a = (accountData || []) as DealerAccount[];
      setTenants(t);
      setAccounts(a);

      // Aggregate submissions by dealership
      const aggMap: Record<string, SubmissionAgg> = {};
      (subData || []).forEach((s: any) => {
        if (!aggMap[s.dealership_id]) {
          aggMap[s.dealership_id] = {
            dealership_id: s.dealership_id,
            total: 0,
            with_offer: 0,
            purchased: 0,
            avg_offer: null,
          };
        }
        const agg = aggMap[s.dealership_id];
        agg.total++;
        if (s.offered_price && s.offered_price > 0) {
          agg.with_offer++;
        }
        if (s.progress_status === "purchase_complete") {
          agg.purchased++;
        }
      });

      // Calculate avg offer per dealership
      const offersByDealer: Record<string, number[]> = {};
      (subData || []).forEach((s: any) => {
        if (s.offered_price && s.offered_price > 0) {
          if (!offersByDealer[s.dealership_id]) offersByDealer[s.dealership_id] = [];
          offersByDealer[s.dealership_id].push(Number(s.offered_price));
        }
      });
      Object.entries(offersByDealer).forEach(([did, offers]) => {
        if (aggMap[did]) {
          aggMap[did].avg_offer = offers.reduce((a, b) => a + b, 0) / offers.length;
        }
      });

      const aggs = Object.values(aggMap);
      setSubmissionAggs(aggs);

      // Platform-level metrics
      const totalSubs = aggs.reduce((s, a) => s + a.total, 0);
      const totalPurchased = aggs.reduce((s, a) => s + a.purchased, 0);
      const mrr = a.filter((d) => d.onboarding_status === "active").reduce((s, d) => s + Number(d.plan_cost), 0);

      setMetrics({
        totalTenants: t.length,
        activeTenants: t.filter((x) => x.is_active).length,
        totalSubmissions: totalSubs,
        totalPurchased,
        mrr,
        avgConversion: totalSubs > 0 ? (totalPurchased / totalSubs) * 100 : 0,
      });
    } catch (e) {
      toast.error("Failed to load platform data");
    }
    setLoading(false);
  };

  const getAccount = (dealershipId: string) =>
    accounts.find((a) => a.dealership_id === dealershipId);

  const getAgg = (dealershipId: string) =>
    submissionAggs.find((a) => a.dealership_id === dealershipId);

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
      active: { variant: "default", icon: CheckCircle2 },
      pending: { variant: "secondary", icon: Clock },
      paused: { variant: "outline", icon: Clock },
      cancelled: { variant: "destructive", icon: XCircle },
    };
    const cfg = map[status] || map.pending;
    const Icon = cfg.icon;
    return (
      <Badge variant={cfg.variant} className="gap-1 capitalize">
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground font-display">
              Platform Command Center
            </h1>
            <p className="text-sm text-muted-foreground">
              All tenants · Subscriptions · Performance
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KPICard
              icon={Building2}
              label="Total Tenants"
              value={metrics.totalTenants}
            />
            <KPICard
              icon={CheckCircle2}
              label="Active"
              value={metrics.activeTenants}
              accent="text-emerald-600"
            />
            <KPICard
              icon={DollarSign}
              label="MRR"
              value={`$${metrics.mrr.toLocaleString()}`}
              accent="text-emerald-600"
            />
            <KPICard
              icon={Car}
              label="Total Leads"
              value={metrics.totalSubmissions.toLocaleString()}
            />
            <KPICard
              icon={TrendingUp}
              label="Purchased"
              value={metrics.totalPurchased.toLocaleString()}
            />
            <KPICard
              icon={BarChart3}
              label="Avg Conversion"
              value={`${metrics.avgConversion.toFixed(1)}%`}
            />
          </div>
        )}

        {/* Tenant Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              All Dealerships
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : tenants.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No tenants found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Dealership
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                        Slug / Domain
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                        Plan
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                        Cost
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                        Leads
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                        Purchased
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                        Avg Offer
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((tenant) => {
                      const acct = getAccount(tenant.dealership_id);
                      const agg = getAgg(tenant.dealership_id);
                      return (
                        <tr
                          key={tenant.dealership_id}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">
                              {tenant.display_name || tenant.slug}
                            </div>
                            <div className="text-xs text-muted-foreground sm:hidden">
                              {tenant.custom_domain || tenant.slug}
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <div className="text-xs text-muted-foreground font-mono">
                              {tenant.slug}
                            </div>
                            {tenant.custom_domain && (
                              <div className="text-xs text-primary font-mono">
                                {tenant.custom_domain}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {acct
                              ? statusBadge(acct.onboarding_status)
                              : statusBadge("pending")}
                          </td>
                          <td className="px-4 py-3 text-right hidden md:table-cell">
                            <span className="capitalize text-muted-foreground">
                              {acct?.plan_tier || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right hidden md:table-cell font-medium">
                            {acct
                              ? `$${Number(acct.plan_cost).toLocaleString()}/mo`
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {agg?.total?.toLocaleString() || "0"}
                          </td>
                          <td className="px-4 py-3 text-right hidden lg:table-cell">
                            {agg?.purchased?.toLocaleString() || "0"}
                          </td>
                          <td className="px-4 py-3 text-right hidden lg:table-cell text-muted-foreground">
                            {agg?.avg_offer
                              ? `$${Math.round(agg.avg_offer).toLocaleString()}`
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const KPICard = ({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Building2;
  label: string;
  value: string | number;
  accent?: string;
}) => (
  <Card className="border-border/50">
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-xl font-bold ${accent || "text-foreground"}`}>{value}</p>
    </CardContent>
  </Card>
);

export default SuperAdminDashboard;
