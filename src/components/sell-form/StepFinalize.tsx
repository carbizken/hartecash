import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FormField from "./FormField";
import RadioOption from "./RadioOption";
import type { FormData } from "./types";
import type { FormConfig } from "@/hooks/useFormConfig";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { supabase } from "@/integrations/supabase/client";

interface DealerLocation {
  id: string;
  name: string;
  city: string;
  state: string;
}

interface Props {
  formData: FormData;
  update: (field: string, value: string) => void;
  formConfig?: FormConfig;
  leadSource?: string;
}

const StepFinalize = ({ formData, update, formConfig, leadSource }: Props) => {
  const { config } = useSiteConfig();
  const dealerName = config.dealership_name || "our dealership";
  const showLoanSection = !formConfig || formConfig.q_loan_details;
  const showLoanFields = showLoanSection && (formData.loanStatus === "Sell" || formData.loanStatus === "Trade-In");
  const showLeaseFields = showLoanSection && formData.loanStatus === "Lease Buyout";
  const isTrade = leadSource === "trade";

  // Show location picker for landing page if admin enabled it, or always for trade page
  const showLocationPicker = isTrade || (config as any).assign_customer_picks === true;

  const [locations, setLocations] = useState<DealerLocation[]>([]);

  useEffect(() => {
    if (showLocationPicker) {
      supabase
        .from("dealership_locations")
        .select("id, name, city, state")
        .eq("is_active", true)
        .eq("show_in_scheduling", true)
        .order("sort_order")
        .then(({ data }) => { if (data) setLocations(data); });
    }
  }, [showLocationPicker]);

  return (
    <>
      <FormField label="Where is your vehicle located?">
        <Input
          placeholder="ZIP code"
          value={formData.zip}
          onChange={(e) => update("zip", e.target.value)}
          className="py-3.5 px-4 text-base border-2 border-input focus:border-accent focus:ring-accent/10"
        />
      </FormField>

      {showLocationPicker && locations.length > 0 && (
        <FormField label={isTrade ? "Which location are you working with?" : "Preferred dealership location"}>
          <Select
            value={formData.preferredLocationId || ""}
            onValueChange={v => update("preferredLocationId", v)}
          >
            <SelectTrigger className="py-3.5 px-4 text-base border-2 border-input focus:border-accent focus:ring-accent/10">
              <SelectValue placeholder="Select a location..." />
            </SelectTrigger>
            <SelectContent>
              {locations.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name} — {loc.city}, {loc.state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      )}

      {isTrade && (
        <FormField label="Salesperson or contact you're working with" hint="Enter the name of the person at the dealership (optional).">
          <Input
            placeholder="e.g. Mike S."
            value={formData.salespersonName}
            onChange={(e) => update("salespersonName", e.target.value)}
            className="py-3.5 px-4 text-base border-2 border-input focus:border-accent focus:ring-accent/10"
          />
        </FormField>
      )}

      {showLoanSection && (
        <FormField label="What would you like to do?" hint="Sell outright, trade in for tax savings, or buy out your lease.">
          <div className="grid grid-cols-2 gap-2">
            {["Sell", "Trade-In", "Lease Buyout", "Not Sure"].map((opt) => (
              <RadioOption key={opt} label={opt} selected={formData.loanStatus === opt} onClick={() => update("loanStatus", opt)} />
            ))}
          </div>
        </FormField>
      )}

      {formData.loanStatus === "Trade-In" && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg mb-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            💡 <strong>Trade-In Tax Savings:</strong> When you trade in your vehicle with a new purchase, you only pay sales tax on the difference — saving you hundreds or even thousands.
          </p>
        </div>
      )}

      {showLeaseFields && (
        <>
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg mb-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              💡 <strong>Lease Buyout:</strong> We'll purchase your leased vehicle directly. If your car is worth more than the buyout price, you keep the equity.
            </p>
          </div>
          <FormField label="Leasing Company">
            <Input
              placeholder="e.g. Toyota Financial, Ally, GM Financial"
              value={formData.loanCompany}
              onChange={(e) => update("loanCompany", e.target.value)}
              className="py-3.5 px-4 text-base border-2 border-input focus:border-accent focus:ring-accent/10"
            />
          </FormField>
          <FormField label="Lease Buyout Amount">
            <Input
              placeholder="$18,500"
              value={formData.loanBalance}
              onChange={(e) => update("loanBalance", e.target.value)}
              className="py-3.5 px-4 text-base border-2 border-input focus:border-accent focus:ring-accent/10"
            />
          </FormField>
          <FormField label="Monthly Lease Payment">
            <Input
              placeholder="$350"
              value={formData.loanPayment}
              onChange={(e) => update("loanPayment", e.target.value)}
              className="py-3.5 px-4 text-base border-2 border-input focus:border-accent focus:ring-accent/10"
            />
          </FormField>
        </>
      )}

      {showLoanFields && (
        <FormField label="Do you have a loan on this vehicle?">
          <div className="grid grid-cols-2 gap-2">
            {["Yes — Has Loan", "No — Owned Free"].map((opt) => (
              <RadioOption key={opt} label={opt} selected={formData.loanCompany === opt} onClick={() => update("loanCompany", opt)} />
            ))}
          </div>
        </FormField>
      )}

      {showLoanFields && formData.loanCompany === "Yes — Has Loan" && (
        <>
          <FormField label="Lender Name">
            <Input
              placeholder="e.g. Chase Auto, Capital One"
              value={formData.loanBalance}
              onChange={(e) => update("loanBalance", e.target.value)}
              className="py-3.5 px-4 text-base border-2 border-input focus:border-accent focus:ring-accent/10"
            />
          </FormField>
          <FormField label="Remaining Balance">
            <Input
              placeholder="$12,000"
              value={formData.loanPayment}
              onChange={(e) => update("loanPayment", e.target.value)}
              className="py-3.5 px-4 text-base border-2 border-input focus:border-accent focus:ring-accent/10"
            />
          </FormField>
        </>
      )}

      <div className="border-t-2 border-muted pt-5 mt-2">
        <p className="text-sm font-semibold text-card-foreground mb-4">
          See your offer right away. Add your details and we'll also send you a copy.
        </p>
      </div>

      <FormField label="Email Address">
        <Input
          type="email"
          placeholder="john@example.com"
          value={formData.email}
          onChange={(e) => update("email", e.target.value)}
          className="py-3.5 px-4 text-base border-2 border-input focus:border-accent focus:ring-accent/10"
        />
      </FormField>
      <FormField label="Full Name">
        <Input
          placeholder="John Smith"
          value={formData.name}
          onChange={(e) => update("name", e.target.value)}
          className="py-3.5 px-4 text-base border-2 border-input focus:border-accent focus:ring-accent/10"
        />
      </FormField>
      <FormField label="Phone Number">
        <Input
          type="tel"
          placeholder="(555) 123-4567"
          value={formData.phone}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
            let formatted = digits;
            if (digits.length > 6) formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
            else if (digits.length > 3) formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
            else if (digits.length > 0) formatted = `(${digits}`;
            update("phone", formatted);
          }}
          className="py-3.5 px-4 text-base border-2 border-input focus:border-accent focus:ring-accent/10"
        />
      </FormField>

      <div className="p-3 bg-muted/50 border border-border rounded-lg mb-2">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          By submitting this form, you consent to receive autodialed calls, texts (SMS/MMS), and emails from {dealerName} at the phone number and email provided regarding your vehicle submission, offer, and appointment. Consent is not a condition of purchase. Msg & data rates may apply. Msg frequency varies. Reply STOP to opt out. See our{" "}
          <a href="/privacy#sms-consent" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:no-underline">Privacy Policy</a>{" "}
          and{" "}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:no-underline">Terms of Service</a>.
        </p>
      </div>
    </>
  );
};

export default StepFinalize;
