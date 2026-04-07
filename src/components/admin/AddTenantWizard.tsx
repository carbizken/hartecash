import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Building2, Globe, Sparkles, Loader2, CheckCircle2, ArrowRight,
  ArrowLeft, X, Rocket, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

type Step = "basics" | "scrape" | "review" | "creating";

const AddTenantWizard = ({ onClose, onCreated }: Props) => {
  const [step, setStep] = useState<Step>("basics");

  // Basics
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [planTier, setPlanTier] = useState("standard");
  const [architecture, setArchitecture] = useState("single_store");
  const [bdcModel, setBdcModel] = useState("no_bdc");

  // Scrape
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<Record<string, any> | null>(null);
  const [scrapeError, setScrapeError] = useState("");
  const [skipScrape, setSkipScrape] = useState(false);

  // Creating
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; steps?: string[]; error?: string } | null>(null);

  const dealershipId = slug.toLowerCase().replace(/[^a-z0-9_-]/g, "_") || "new_dealer";

  const handleSlugFromName = (name: string) => {
    setDisplayName(name);
    if (!slug || slug === displayName.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_")) {
      setSlug(name.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_"));
    }
  };

  const handleScrape = async () => {
    if (!websiteUrl.trim()) return;
    setScraping(true);
    setScrapeError("");
    setScrapedData(null);

    try {
      const { data, error } = await supabase.functions.invoke("scrape-dealer-site", {
        body: { url: websiteUrl },
      });
      if (error) throw error;
      if (data?.success && data?.data) {
        setScrapedData(data.data);
        toast.success(`Extracted data from ${data.pages_scraped} pages`);
      } else {
        setScrapeError(data?.error || "No data extracted");
      }
    } catch (e: any) {
      setScrapeError(e.message || "Scrape failed");
    } finally {
      setScraping(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    setStep("creating");
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("onboard-tenant", {
        body: {
          dealership_id: dealershipId,
          slug,
          display_name: displayName,
          custom_domain: customDomain || null,
          plan_tier: planTier,
          architecture,
          bdc_model: bdcModel,
          scraped_data: skipScrape ? null : scrapedData,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult({ success: true, steps: data.steps });
      toast.success(`${displayName} onboarded successfully!`);
    } catch (e: any) {
      setResult({ success: false, error: e.message });
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const canProceedBasics = displayName.trim() && slug.trim();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-card-foreground">Add New Tenant</h2>
              <p className="text-xs text-muted-foreground">
                {step === "basics" && "Step 1 · Dealership Details"}
                {step === "scrape" && "Step 2 · AI Website Scan"}
                {step === "review" && "Step 3 · Review & Launch"}
                {step === "creating" && "Provisioning…"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={creating}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4">
          <div className="flex gap-1.5">
            {["basics", "scrape", "review", "creating"].map((s, i) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= ["basics", "scrape", "review", "creating"].indexOf(step)
                    ? "bg-primary"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* ── STEP: BASICS ── */}
          {step === "basics" && (
            <>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dealership Name *</label>
                  <Input
                    value={displayName}
                    onChange={(e) => handleSlugFromName(e.target.value)}
                    placeholder="Smith Motors"
                    className="mt-1.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Slug *</label>
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                      placeholder="smith_motors"
                      className="mt-1.5 font-mono text-sm"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Also used as dealership_id</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custom Domain</label>
                    <Input
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="sellmycar.smithmotors.com"
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan</label>
                    <Select value={planTier} onValueChange={setPlanTier}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard ($1,995)</SelectItem>
                        <SelectItem value="multi_store">Multi-Store ($3,495)</SelectItem>
                        <SelectItem value="group">Group ($5,995)</SelectItem>
                        <SelectItem value="enterprise">Enterprise (Custom)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Architecture</label>
                    <Select value={architecture} onValueChange={setArchitecture}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single_store">Single Store</SelectItem>
                        <SelectItem value="multi_location">Multi-Location</SelectItem>
                        <SelectItem value="dealer_group">Dealer Group</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">BDC Model</label>
                    <Select value={bdcModel} onValueChange={setBdcModel}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_bdc">No BDC</SelectItem>
                        <SelectItem value="single_bdc">Single BDC</SelectItem>
                        <SelectItem value="multi_bdc">Multi BDC</SelectItem>
                        <SelectItem value="ai_bdc">AI BDC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {customDomain && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <Globe className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <div className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
                        <p className="font-semibold">DNS Setup Required</p>
                        <p>After creating the tenant, the dealer must point their domain's DNS:</p>
                        <ul className="list-disc list-inside space-y-0.5 ml-1">
                          <li>A Record <code className="bg-muted px-1 rounded">@</code> → <code className="bg-muted px-1 rounded">185.158.133.1</code></li>
                          <li>A Record <code className="bg-muted px-1 rounded">www</code> → <code className="bg-muted px-1 rounded">185.158.133.1</code></li>
                          <li>TXT Record <code className="bg-muted px-1 rounded">_lovable</code> → verification value</li>
                        </ul>
                        <p>Then add the domain in <strong>Project Settings → Domains</strong> for SSL.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep("scrape")} disabled={!canProceedBasics} className="gap-1.5">
                  Next: AI Scan <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </>
          )}

          {/* ── STEP: SCRAPE ── */}
          {step === "scrape" && (
            <>
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-primary/5 to-primary/0 border border-primary/10 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-card-foreground">AI Website Scanner</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter the dealer's website URL. We'll scan their homepage, about page, hours, and staff pages to automatically extract branding, hours, story, and contact info.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://www.smithmotors.com"
                    disabled={scraping}
                    className="flex-1"
                  />
                  <Button onClick={handleScrape} disabled={scraping || !websiteUrl.trim()} className="gap-1.5">
                    {scraping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {scraping ? "Scanning…" : "Scan"}
                  </Button>
                </div>

                {scrapeError && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                    <p className="text-xs text-destructive">{scrapeError}</p>
                  </div>
                )}

                {scrapedData && (
                  <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-semibold text-card-foreground">Data Extracted</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      {scrapedData.dealership_name && <Field label="Name" value={scrapedData.dealership_name} />}
                      {scrapedData.phone && <Field label="Phone" value={scrapedData.phone} />}
                      {scrapedData.email && <Field label="Email" value={scrapedData.email} />}
                      {scrapedData.address && <Field label="Address" value={scrapedData.address} />}
                      {scrapedData.established_year && <Field label="Est." value={scrapedData.established_year} />}
                      {scrapedData.architecture && <Field label="Type" value={scrapedData.architecture} />}
                      {scrapedData.stats_rating && <Field label="Rating" value={`${scrapedData.stats_rating} ★`} />}
                      {scrapedData.oem_brands?.length > 0 && <Field label="Brands" value={scrapedData.oem_brands.join(", ")} />}
                      {scrapedData.locations?.length > 0 && <Field label="Locations" value={`${scrapedData.locations.length} found`} />}
                      {scrapedData.business_hours?.length > 0 && <Field label="Hours" value={`${scrapedData.business_hours.length} entries`} />}
                      {scrapedData.staff_emails?.length > 0 && <Field label="Staff Emails" value={`${scrapedData.staff_emails.length} found`} />}
                    </div>
                    {scrapedData.about_story && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">About Story</p>
                        <p className="text-xs text-muted-foreground line-clamp-3">{scrapedData.about_story}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => setStep("basics")} className="gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => { setSkipScrape(true); setStep("review"); }}
                    className="text-xs"
                  >
                    Skip — Use Defaults
                  </Button>
                  <Button
                    onClick={() => setStep("review")}
                    disabled={!scrapedData && !skipScrape}
                    className="gap-1.5"
                  >
                    Next: Review <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* ── STEP: REVIEW ── */}
          {step === "review" && (
            <>
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-card-foreground">Confirm Tenant Setup</h3>

                <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-2 text-xs">
                  <Field label="Dealership ID" value={dealershipId} />
                  <Field label="Display Name" value={displayName} />
                  <Field label="Slug" value={slug} />
                  {customDomain && <Field label="Custom Domain" value={customDomain} />}
                  <Field label="Plan" value={planTier} />
                  <Field label="Architecture" value={architecture.replace(/_/g, " ")} />
                  <Field label="Data Source" value={skipScrape ? "Defaults only" : `AI-scraped from ${websiteUrl}`} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">The following will be created:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["tenant", "dealer_account", "site_config", "form_config", "offer_settings",
                      "notification_settings", "inspection_config", "photo_config", "locations",
                      "notification_templates"
                    ].map(t => (
                      <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => setStep("scrape")} className="gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </Button>
                <Button onClick={handleCreate} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Rocket className="w-3.5 h-3.5" /> Launch Tenant
                </Button>
              </div>
            </>
          )}

          {/* ── STEP: CREATING ── */}
          {step === "creating" && (
            <div className="text-center py-8 space-y-4">
              {creating && (
                <>
                  <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">Provisioning {displayName}…</p>
                  <p className="text-xs text-muted-foreground">Seeding config tables, locations, templates…</p>
                </>
              )}
              {result?.success && (
                <>
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h3 className="text-lg font-bold text-card-foreground">Tenant Created!</h3>
                  <p className="text-sm text-muted-foreground">
                    {displayName} is live. {result.steps?.length} config tables seeded.
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {result.steps?.map(s => (
                      <Badge key={s} variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> {s}
                      </Badge>
                    ))}
                  </div>
                  {customDomain && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-400 mt-4 max-w-md mx-auto">
                      <p className="font-semibold">Next: Connect the custom domain</p>
                      <p className="mt-1">Go to <strong>Project Settings → Domains</strong> and add <code className="bg-muted px-1 rounded">{customDomain}</code>. Then have the dealer point their DNS A records to <code className="bg-muted px-1 rounded">185.158.133.1</code>.</p>
                    </div>
                  )}
                  <Button onClick={() => { onCreated(); onClose(); }} className="mt-4">
                    Done
                  </Button>
                </>
              )}
              {result && !result.success && (
                <>
                  <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
                  <h3 className="text-lg font-bold text-card-foreground">Failed</h3>
                  <p className="text-sm text-destructive">{result.error}</p>
                  <Button variant="outline" onClick={() => setStep("review")}>
                    Back to Review
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-card-foreground truncate max-w-[60%] text-right">{value}</span>
  </div>
);

export default AddTenantWizard;
