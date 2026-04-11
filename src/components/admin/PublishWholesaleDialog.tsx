import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Store, ShieldAlert } from "lucide-react";
import type { Submission } from "@/lib/adminConstants";

interface Props {
  submission: Submission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealershipId: string;
  onPublished?: () => void;
}

/**
 * Publishes a dead-lead submission to the wholesale marketplace.
 * Snapshots the vehicle fields at publish time so the listing is
 * self-contained even if the source submission is later deleted.
 */
const PublishWholesaleDialog = ({ submission, open, onOpenChange, dealershipId, onPublished }: Props) => {
  const { toast } = useToast();
  const [askingPrice, setAskingPrice] = useState("");
  const [reservePrice, setReservePrice] = useState("");
  const [expiresHours, setExpiresHours] = useState("72");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Initialize asking price from ACV if available when dialog opens
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && submission) {
      const seed = submission.acv_value ?? submission.offered_price ?? 0;
      setAskingPrice(seed ? String(Math.round(seed)) : "");
      setReservePrice("");
      setExpiresHours("72");
      setNotes("");
    }
    onOpenChange(nextOpen);
  };

  const handlePublish = async () => {
    if (!submission) return;
    const ask = parseInt(askingPrice.replace(/[^\d]/g, ""), 10);
    if (!ask || ask <= 0) {
      toast({ title: "Asking price required", description: "Enter an asking price greater than zero.", variant: "destructive" });
      return;
    }
    const reserve = reservePrice ? parseInt(reservePrice.replace(/[^\d]/g, ""), 10) : null;
    const hours = parseInt(expiresHours, 10) || 72;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const actorEmail = userData?.user?.email || "unknown";

    const { error } = await (supabase as any).from("wholesale_listings").insert({
      dealership_id: dealershipId,
      submission_id: submission.id,
      created_by: actorEmail,
      vehicle_year: submission.vehicle_year,
      vehicle_make: submission.vehicle_make,
      vehicle_model: submission.vehicle_model,
      vin: submission.vin,
      mileage: submission.mileage,
      exterior_color: submission.exterior_color,
      class_name: (submission as any).bb_class_name || null,
      overall_condition: submission.overall_condition,
      asking_price: ask,
      reserve_price: reserve,
      acv_value: submission.acv_value != null ? Math.round(submission.acv_value) : null,
      status: "active",
      expires_at: expiresAt,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Publish failed", description: error.message, variant: "destructive" });
      return;
    }

    // Audit entry on the source submission
    await supabase.from("activity_log").insert({
      submission_id: submission.id,
      action: "Published to Wholesale",
      old_value: null,
      new_value: `Asking $${ask.toLocaleString()} · ${hours}h`,
      performed_by: actorEmail,
    });

    toast({ title: "Listing published", description: `Visible in the wholesale marketplace for ${hours} hours.` });
    onOpenChange(false);
    onPublished?.();
  };

  const vehicleLabel = submission
    ? [submission.vehicle_year, submission.vehicle_make, submission.vehicle_model].filter(Boolean).join(" ") || "Vehicle"
    : "";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            Publish to Wholesale
          </DialogTitle>
          <DialogDescription>
            Offers {vehicleLabel} to other dealers in the Autocurb wholesale network.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ask-price" className="text-xs">Asking Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                <Input
                  id="ask-price"
                  className="pl-7"
                  value={askingPrice}
                  onChange={(e) => setAskingPrice(e.target.value)}
                  placeholder="0"
                  inputMode="numeric"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reserve-price" className="text-xs">Reserve (optional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                <Input
                  id="reserve-price"
                  className="pl-7"
                  value={reservePrice}
                  onChange={(e) => setReservePrice(e.target.value)}
                  placeholder="0"
                  inputMode="numeric"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expires" className="text-xs">Listing Duration</Label>
            <Select value={expiresHours} onValueChange={setExpiresHours}>
              <SelectTrigger id="expires"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="48">48 hours</SelectItem>
                <SelectItem value="72">72 hours (default)</SelectItem>
                <SelectItem value="168">1 week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs">Notes (visible to bidders)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Known issues, reason for wholesaling, pickup logistics…"
              rows={3}
            />
          </div>

          <div className="flex items-start gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              Phase 1: Autocurb does not handle payment or title transfer. Once a
              bid is accepted, you and the buyer settle directly.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handlePublish} disabled={saving}>
            {saving ? "Publishing…" : "Publish Listing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PublishWholesaleDialog;
