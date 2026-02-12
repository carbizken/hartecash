import { Label } from "@/components/ui/label";

interface FormFieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

const FormField = ({ label, hint, children }: FormFieldProps) => (
  <div className="mb-5">
    <Label className="text-sm font-semibold text-card-foreground mb-2 block">
      {label}
    </Label>
    {hint && <p className="text-xs text-muted-foreground mb-2">{hint}</p>}
    {children}
  </div>
);

export default FormField;
