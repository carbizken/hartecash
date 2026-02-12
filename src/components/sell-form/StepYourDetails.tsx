import { Input } from "@/components/ui/input";
import FormField from "./FormField";
import RadioOption from "./RadioOption";
import type { FormData } from "./types";

interface Props {
  formData: FormData;
  update: (field: string, value: string) => void;
}

const StepYourDetails = ({ formData, update }: Props) => (
  <>
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
        onChange={(e) => update("phone", e.target.value)}
        className="py-3.5 px-4 text-base border-2 border-input focus:border-accent focus:ring-accent/10"
      />
    </FormField>
    <FormField label="Email Address">
      <Input
        type="email"
        placeholder="john@example.com"
        value={formData.email}
        onChange={(e) => update("email", e.target.value)}
        className="py-3.5 px-4 text-base border-2 border-input focus:border-accent focus:ring-accent/10"
      />
    </FormField>
    <FormField label="ZIP Code">
      <Input
        placeholder="06001"
        value={formData.zip}
        onChange={(e) => update("zip", e.target.value)}
        className="py-3.5 px-4 text-base border-2 border-input focus:border-accent focus:ring-accent/10"
      />
    </FormField>
    <FormField label="Do you want to sell or trade in your vehicle?" hint="Sell us your car or trade it in with your purchase. We'll guide you through it.">
      <div className="grid grid-cols-3 gap-2">
        {["Sell", "Trade-In", "Not Sure"].map((opt) => (
          <RadioOption key={opt} label={opt} selected={formData.loanStatus === opt} onClick={() => update("loanStatus", opt)} />
        ))}
      </div>
    </FormField>
    {formData.loanStatus === "Loan" && (
      <>
        <FormField label="Loan Company">
          <Input
            placeholder="e.g. Chase Auto, Capital One"
            value={formData.loanCompany}
            onChange={(e) => update("loanCompany", e.target.value)}
            className="py-3.5 px-4 text-base border-2 border-input focus:border-accent focus:ring-accent/10"
          />
        </FormField>
        <FormField label="Remaining Balance">
          <Input
            placeholder="$12,000"
            value={formData.loanBalance}
            onChange={(e) => update("loanBalance", e.target.value)}
            className="py-3.5 px-4 text-base border-2 border-input focus:border-accent focus:ring-accent/10"
          />
        </FormField>
        <FormField label="Monthly Payment">
          <Input
            placeholder="$350"
            value={formData.loanPayment}
            onChange={(e) => update("loanPayment", e.target.value)}
            className="py-3.5 px-4 text-base border-2 border-input focus:border-accent focus:ring-accent/10"
          />
        </FormField>
      </>
    )}
  </>
);

export default StepYourDetails;
