import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import SignaturePad from "@/components/admin/SignaturePad";

/**
 * Public-facing mobile onboarding page.
 * Dealers can fill in answers and sign from their phone/tablet
 * without needing admin access.
 */

interface QuestionItem {
  id: string;
  label: string;
  type: "text" | "check" | "choice" | "multiline";
  choices?: string[];
  hint?: string;
}

interface Section {
  title: string;
  icon: string;
  questions: QuestionItem[];
}

const SECTIONS: Section[] = [
  {
    title: "1. Dealership Identity",
    icon: "🏢",
    questions: [
      { id: "dealership_name", label: "Dealership Name", type: "text" },
      { id: "tagline", label: "Tagline / Slogan", type: "text" },
      { id: "phone", label: "Main Phone Number", type: "text" },
      { id: "email", label: "Main Email Address", type: "text" },
      { id: "address", label: "Physical Address", type: "text" },
      { id: "website", label: "Website URL", type: "text" },
    ],
  },
  {
    title: "2. Architecture & BDC",
    icon: "🏗️",
    questions: [
      { id: "architecture", label: "Store Architecture", type: "choice", choices: ["Single Store", "Multi-Location", "Dealer Group"] },
      { id: "bdc_model", label: "BDC Model", type: "choice", choices: ["No BDC", "Single BDC", "Multi-Location BDC", "AI BDC"] },
      { id: "num_locations", label: "Number of Locations", type: "text" },
      { id: "special_instructions", label: "Special Instructions / Notes", type: "multiline" },
    ],
  },
  {
    title: "3. Branding & Colors",
    icon: "🎨",
    questions: [
      { id: "primary_color", label: "Primary Brand Color (hex)", type: "text", hint: "e.g. #1e3a5f" },
      { id: "accent_color", label: "Accent Color (hex)", type: "text" },
      { id: "logo_provided", label: "Logo file provided?", type: "check" },
    ],
  },
  {
    title: "4. Hero & Landing Page",
    icon: "📢",
    questions: [
      { id: "hero_headline", label: "Hero Headline", type: "text" },
      { id: "hero_subtext", label: "Hero Sub-text", type: "text" },
      { id: "hero_layout", label: "Hero Layout", type: "choice", choices: ["Offset Right", "Offset Left", "Stacked"] },
    ],
  },
  {
    title: "5. Lead Form Flow",
    icon: "📝",
    questions: [
      { id: "flow_style", label: "Flow style", type: "choice", choices: ["Details First", "Offer First"] },
      { id: "guarantee_days", label: "Price Guarantee Days", type: "text", hint: "Default: 8" },
    ],
  },
  {
    title: "6. Notifications",
    icon: "🔔",
    questions: [
      { id: "staff_emails", label: "Staff Email Recipients", type: "multiline", hint: "One per line" },
      { id: "staff_sms", label: "Staff SMS Recipients", type: "multiline", hint: "One per line" },
    ],
  },
  {
    title: "7. Locations",
    icon: "📍",
    questions: [
      { id: "loc1_name", label: "Location 1 — Name", type: "text" },
      { id: "loc1_address", label: "Location 1 — Address", type: "text" },
      { id: "loc1_csz", label: "Location 1 — City, State, ZIP", type: "text" },
      { id: "loc2_name", label: "Location 2 — Name", type: "text" },
      { id: "loc2_address", label: "Location 2 — Address", type: "text" },
      { id: "loc2_csz", label: "Location 2 — City, State, ZIP", type: "text" },
    ],
  },
  {
    title: "8. Staff & Roles",
    icon: "👥",
    questions: [
      { id: "admin_users", label: "Admin Users (email)", type: "multiline" },
      { id: "gsm_users", label: "GSM/GM Users (email)", type: "multiline" },
      { id: "ucm_users", label: "Used Car Managers (email)", type: "multiline" },
    ],
  },
];

type Answers = Record<string, string>;

export default function OnboardingMobile() {
  const { dealershipId } = useParams<{ dealershipId: string }>();
  const [answers, setAnswers] = useState<Answers>({});
  const [dealerSig, setDealerSig] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [dealerName, setDealerName] = useState("");

  const did = dealershipId || "default";

  useEffect(() => {
    const load = async () => {
      const [acctRes, configRes] = await Promise.all([
        supabase
          .from("dealer_accounts")
          .select("onboarding_answers, onboarding_signature_dealer")
          .eq("dealership_id", did)
          .maybeSingle(),
        supabase
          .from("site_config")
          .select("dealership_name")
          .eq("dealership_id", did)
          .maybeSingle(),
      ]);
      if (acctRes.data) {
        if (acctRes.data.onboarding_answers && typeof acctRes.data.onboarding_answers === "object") {
          setAnswers(acctRes.data.onboarding_answers as Answers);
        }
        setDealerSig((acctRes.data as any).onboarding_signature_dealer || null);
      }
      if (configRes.data) {
        setDealerName(configRes.data.dealership_name || "");
      }
      setLoading(false);
    };
    load();
  }, [did]);

  const updateAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const toggleChoice = (id: string, choice: string) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: prev[id] === choice ? "" : choice,
    }));
  };

  const handleSave = async () => {
    if (!dealerSig) {
      toast.error("Please sign before saving");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("dealer_accounts")
      .update({
        onboarding_answers: answers,
        onboarding_signature_dealer: dealerSig,
        onboarding_signed_at: new Date().toISOString(),
      } as any)
      .eq("dealership_id", did);

    if (error) {
      toast.error("Failed to save");
    } else {
      setSaved(true);
      toast.success("Saved! Your onboarding specialist will review.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (saved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-4 max-w-sm">
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
          <h1 className="text-2xl font-bold">All Set!</h1>
          <p className="text-muted-foreground">
            Your onboarding answers and signature have been saved. Your specialist will review and configure your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Onboarding</h1>
            <p className="text-xs text-muted-foreground">{dealerName || "New Dealer Setup"}</p>
          </div>
          <Button onClick={handleSave} size="sm" disabled={saving} className="gap-1.5">
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-5 pb-32">
        {SECTIONS.map((section) => (
          <div key={section.title} className="border rounded-lg overflow-hidden">
            <div className="bg-primary/10 px-4 py-2.5 border-b border-primary/20">
              <h3 className="text-sm font-bold flex items-center gap-2 text-primary">
                <span>{section.icon}</span>
                {section.title}
              </h3>
            </div>
            <div className="divide-y">
              {section.questions.map((q) => (
                <div key={q.id} className="px-4 py-3 space-y-1.5">
                  <p className="text-sm font-medium">{q.label}</p>
                  {q.hint && <p className="text-xs text-muted-foreground">{q.hint}</p>}

                  {q.type === "text" && (
                    <Input
                      className="h-9 text-sm"
                      placeholder="—"
                      value={answers[q.id] || ""}
                      onChange={(e) => updateAnswer(q.id, e.target.value)}
                      maxLength={500}
                    />
                  )}

                  {q.type === "multiline" && (
                    <Textarea
                      className="text-sm min-h-[60px]"
                      placeholder="—"
                      value={answers[q.id] || ""}
                      onChange={(e) => updateAnswer(q.id, e.target.value)}
                      maxLength={2000}
                    />
                  )}

                  {q.type === "check" && (
                    <div className="flex items-center gap-3">
                      {["yes", "no"].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => toggleChoice(q.id, v)}
                          className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                            answers[q.id] === v
                              ? v === "yes"
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-destructive text-destructive-foreground border-destructive"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          {v === "yes" ? "Yes" : "No"}
                        </button>
                      ))}
                    </div>
                  )}

                  {q.type === "choice" && q.choices && (
                    <div className="flex flex-wrap gap-1.5">
                      {q.choices.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleChoice(q.id, c)}
                          className={`text-xs px-2.5 py-1.5 rounded-md border transition-colors ${
                            answers[q.id] === c
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Signature */}
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-bold">Your Signature</h3>
          <p className="text-xs text-muted-foreground">
            Sign below to confirm you've provided accurate information for your account setup.
          </p>
          <SignaturePad
            label="Dealer Representative"
            value={dealerSig}
            onChange={setDealerSig}
          />
        </div>

        {/* Bottom save */}
        <Button onClick={handleSave} disabled={saving} className="w-full gap-2" size="lg">
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Submit & Save"}
        </Button>
      </div>
    </div>
  );
}
