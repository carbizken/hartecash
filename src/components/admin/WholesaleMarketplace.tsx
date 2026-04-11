import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Store, Gavel, Car, Clock, TrendingUp, CheckCircle2, XCircle, ShieldAlert, DollarSign, Users,
} from "lucide-react";

/**
 * Wholesale Marketplace — Phase 1 MVP
 *
 * Two tabs:
 *   Inbound  — listings from other dealers that this dealer can browse and bid on
 *   My Listings — listings this dealer has published, with their incoming bids
 *
 * Settlement, escrow, title transfer, and payment are explicitly out of scope
 * for Phase 1. See docs/AUTOCURB_PART_1_PARKED_ITEMS.md.
 */

interface Listing {
  id: string;
  dealership_id: string;
  submission_id: string | null;
  created_by: string | null;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_trim: string | null;
  vin: string | null;
  mileage: string | null;
  exterior_color: string | null;
  class_name: string | null;
  overall_condition: string | null;
  asking_price: number;
  reserve_price: number | null;
  acv_value: number | null;
  status: string;
  expires_at: string;
  sold_to_dealership_id: string | null;
  sold_at: string | null;
  winning_bid_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Bid {
  id: string;
  listing_id: string;
  bidder_dealership_id: string;
  bidder_user: string | null;
  bid_amount: number;
  notes: string | null;
  status: string;
  responded_at: string | null;
  responded_by: string | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  sold: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  expired: "bg-muted text-muted-foreground",
  withdrawn: "bg-destructive/15 text-destructive border-destructive/30",
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  accepted: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

const WholesaleMarketplace = () => {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const dealershipId = tenant.dealership_id;
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);

  // Bid dialog state
  const [bidTarget, setBidTarget] = useState<Listing | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidNotes, setBidNotes] = useState("");
  const [savingBid, setSavingBid] = useState(false);

  // Expanded listing for bid review
  const [expandedListingId, setExpandedListingId] = useState<string | null>(null);

  const fetchMarket = async () => {
    setLoading(true);
    // Expire stale listings best-effort before fetching
    await supabase.rpc("expire_stale_wholesale_listings" as any).catch(() => null);

    const [listingRes, bidRes] = await Promise.all([
      (supabase as any).from("wholesale_listings").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("wholesale_bids").select("*").order("created_at", { ascending: false }),
    ]);
    setListings((listingRes.data as Listing[]) || []);
    setBids((bidRes.data as Bid[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMarket();
  }, [dealershipId]);

  const myListings = useMemo(() => listings.filter(l => l.dealership_id === dealershipId), [listings, dealershipId]);
  const inboundListings = useMemo(() =>
    listings.filter(l => l.dealership_id !== dealershipId && l.status === "active"),
    [listings, dealershipId]
  );

  const bidsByListing = useMemo(() => {
    const map: Record<string, Bid[]> = {};
    bids.forEach(b => {
      if (!map[b.listing_id]) map[b.listing_id] = [];
      map[b.listing_id].push(b);
    });
    return map;
  }, [bids]);

  // Has the current dealer already bid on this listing?
  const myBidFor = (listingId: string) => bids.find(b => b.listing_id === listingId && b.bidder_dealership_id === dealershipId && b.status !== "withdrawn");

  const formatCurrency = (n: number | null) =>
    n == null ? "—" : `$${Math.round(n).toLocaleString()}`;

  const formatTimeRemaining = (expires: string) => {
    const ms = new Date(expires).getTime() - Date.now();
    if (ms <= 0) return "Expired";
    const h = Math.floor(ms / (1000 * 60 * 60));
    if (h < 24) return `${h}h left`;
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h left`;
  };

  const vehicleTitle = (l: Listing) =>
    [l.vehicle_year, l.vehicle_make, l.vehicle_model, l.vehicle_trim]
      .filter(Boolean)
      .join(" ") || "Vehicle";

  const handlePlaceBid = async () => {
    if (!bidTarget) return;
    const amount = parseInt(bidAmount.replace(/[^\d]/g, ""), 10);
    if (!amount || amount <= 0) {
      toast({ title: "Invalid bid", description: "Enter a valid bid amount.", variant: "destructive" });
      return;
    }
    setSavingBid(true);
    const { data: userData } = await supabase.auth.getUser();
    const actorEmail = userData?.user?.email || "unknown";
    const { error } = await (supabase as any).from("wholesale_bids").insert({
      listing_id: bidTarget.id,
      bidder_dealership_id: dealershipId,
      bidder_user: actorEmail,
      bid_amount: amount,
      notes: bidNotes.trim() || null,
      status: "pending",
    });
    setSavingBid(false);
    if (error) {
      toast({ title: "Bid failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Bid placed", description: `$${amount.toLocaleString()} submitted.` });
    setBidTarget(null);
    setBidAmount("");
    setBidNotes("");
    fetchMarket();
  };

  const handleAcceptBid = async (listing: Listing, bid: Bid) => {
    const confirmed = window.confirm(
      `Accept this bid for $${bid.bid_amount.toLocaleString()}? All other bids on this listing will be rejected and the listing will be marked sold.`
    );
    if (!confirmed) return;
    const { data: userData } = await supabase.auth.getUser();
    const actorEmail = userData?.user?.email || "unknown";
    const nowIso = new Date().toISOString();

    // Update accepted bid
    await (supabase as any).from("wholesale_bids").update({
      status: "accepted",
      responded_at: nowIso,
      responded_by: actorEmail,
    }).eq("id", bid.id);

    // Reject all other pending bids on this listing
    await (supabase as any).from("wholesale_bids").update({
      status: "rejected",
      responded_at: nowIso,
      responded_by: actorEmail,
    }).eq("listing_id", listing.id).neq("id", bid.id).eq("status", "pending");

    // Mark listing sold
    await (supabase as any).from("wholesale_listings").update({
      status: "sold",
      sold_to_dealership_id: bid.bidder_dealership_id,
      sold_at: nowIso,
      winning_bid_id: bid.id,
    }).eq("id", listing.id);

    toast({ title: "Sold", description: `Listing sold at $${bid.bid_amount.toLocaleString()}.` });
    fetchMarket();
  };

  const handleRejectBid = async (bid: Bid) => {
    const { data: userData } = await supabase.auth.getUser();
    const actorEmail = userData?.user?.email || "unknown";
    await (supabase as any).from("wholesale_bids").update({
      status: "rejected",
      responded_at: new Date().toISOString(),
      responded_by: actorEmail,
    }).eq("id", bid.id);
    toast({ title: "Bid rejected" });
    fetchMarket();
  };

  const handleWithdrawListing = async (listing: Listing) => {
    const confirmed = window.confirm(
      `Withdraw this listing? Any pending bids will be expired. This cannot be undone.`
    );
    if (!confirmed) return;
    await (supabase as any).from("wholesale_listings").update({ status: "withdrawn" }).eq("id", listing.id);
    await (supabase as any).from("wholesale_bids").update({ status: "expired" })
      .eq("listing_id", listing.id).eq("status", "pending");
    toast({ title: "Listing withdrawn" });
    fetchMarket();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground text-sm">Loading wholesale marketplace…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-black text-card-foreground tracking-tight">Wholesale Marketplace</h2>
            <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/30">
              Phase 1 · Beta
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Move cars you don't want to retail to other dealers in the Autocurb network.
          </p>
        </div>
      </div>

      {/* Info banner — settlement disclaimer */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-700 dark:text-amber-400">
          <strong>Phase 1 scope:</strong> Listings, bids, and acceptance only. Payment,
          title transfer, and pickup logistics happen directly between the two dealers
          outside of Autocurb. Settlement workflow is Phase 2.
        </div>
      </div>

      <Tabs defaultValue="inbound">
        <TabsList>
          <TabsTrigger value="inbound" className="gap-1.5">
            <Gavel className="w-3.5 h-3.5" />
            Inbound ({inboundListings.length})
          </TabsTrigger>
          <TabsTrigger value="mine" className="gap-1.5">
            <Car className="w-3.5 h-3.5" />
            My Listings ({myListings.length})
          </TabsTrigger>
        </TabsList>

        {/* ── INBOUND ── */}
        <TabsContent value="inbound" className="space-y-3 mt-4">
          {inboundListings.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-xl">
              <Store className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm font-semibold text-foreground">No inbound listings</p>
              <p className="text-xs text-muted-foreground mt-1">
                When other dealers publish a wholesale listing, it'll appear here.
              </p>
            </div>
          ) : (
            inboundListings.map(l => {
              const listingBids = bidsByListing[l.id] || [];
              const myBid = myBidFor(l.id);
              return (
                <div key={l.id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-card-foreground">{vehicleTitle(l)}</h3>
                        <Badge className={`text-[10px] ${STATUS_STYLES[l.status] || ""}`}>
                          {l.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {l.vin && <span className="font-mono">VIN {l.vin.slice(-8)}</span>}
                        {l.mileage && <span>{l.mileage} mi</span>}
                        {l.exterior_color && <span>{l.exterior_color}</span>}
                        {l.overall_condition && <span>Condition: {l.overall_condition}</span>}
                      </div>
                      {l.notes && (
                        <p className="text-xs text-muted-foreground italic mt-1.5 line-clamp-2">{l.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Asking</div>
                      <div className="text-xl font-black text-card-foreground">
                        {formatCurrency(l.asking_price)}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" /> {formatTimeRemaining(l.expires_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {listingBids.length} bid{listingBids.length === 1 ? "" : "s"}
                      </span>
                      {myBid && (
                        <Badge variant="outline" className="text-[10px]">
                          Your bid: ${myBid.bid_amount.toLocaleString()} · {myBid.status}
                        </Badge>
                      )}
                    </div>
                    {!myBid && (
                      <Button size="sm" onClick={() => { setBidTarget(l); setBidAmount(String(l.asking_price)); }}>
                        <Gavel className="w-3.5 h-3.5 mr-1" /> Place Bid
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        {/* ── MY LISTINGS ── */}
        <TabsContent value="mine" className="space-y-3 mt-4">
          {myListings.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-xl">
              <Car className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm font-semibold text-foreground">No listings yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Publish a vehicle to the wholesale network from a dead lead's customer
                file — click the "Publish to Wholesale" button on any dead lead.
              </p>
            </div>
          ) : (
            myListings.map(l => {
              const listingBids = bidsByListing[l.id] || [];
              const pendingBids = listingBids.filter(b => b.status === "pending");
              const isExpanded = expandedListingId === l.id;
              return (
                <div key={l.id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-card-foreground">{vehicleTitle(l)}</h3>
                        <Badge className={`text-[10px] ${STATUS_STYLES[l.status] || ""}`}>
                          {l.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {l.vin && <span className="font-mono">VIN {l.vin.slice(-8)}</span>}
                        {l.mileage && <span>{l.mileage} mi</span>}
                        {l.acv_value != null && <span>ACV {formatCurrency(l.acv_value)}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Asking</div>
                      <div className="text-xl font-black text-card-foreground">
                        {formatCurrency(l.asking_price)}
                      </div>
                      {l.reserve_price != null && (
                        <div className="text-[10px] text-muted-foreground">
                          Reserve {formatCurrency(l.reserve_price)}
                        </div>
                      )}
                      {l.status === "active" && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" /> {formatTimeRemaining(l.expires_at)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {listingBids.length} bid{listingBids.length === 1 ? "" : "s"}
                        {pendingBids.length > 0 && (
                          <Badge variant="destructive" className="ml-1 text-[10px]">{pendingBids.length} pending</Badge>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {listingBids.length > 0 && (
                        <Button variant="outline" size="sm" onClick={() => setExpandedListingId(isExpanded ? null : l.id)}>
                          {isExpanded ? "Hide Bids" : "View Bids"}
                        </Button>
                      )}
                      {l.status === "active" && (
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleWithdrawListing(l)}>
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </div>

                  {isExpanded && listingBids.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Incoming Bids
                      </p>
                      {listingBids.map(b => (
                        <div key={b.id} className="flex items-center justify-between gap-3 p-2 rounded-md bg-muted/30">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-card-foreground">
                                ${b.bid_amount.toLocaleString()}
                              </span>
                              <Badge className={`text-[9px] ${STATUS_STYLES[b.status] || ""}`}>
                                {b.status}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(b.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {b.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{b.notes}</p>}
                          </div>
                          {b.status === "pending" && l.status === "active" && (
                            <div className="flex gap-1.5">
                              <Button size="sm" className="h-7 text-xs" onClick={() => handleAcceptBid(l, b)}>
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Accept
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => handleRejectBid(b)}>
                                <XCircle className="w-3 h-3 mr-1" /> Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Bid dialog */}
      <Dialog open={!!bidTarget} onOpenChange={(open) => !open && setBidTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Place Wholesale Bid</DialogTitle>
            <DialogDescription>
              {bidTarget ? vehicleTitle(bidTarget) : ""} — asking {bidTarget ? formatCurrency(bidTarget.asking_price) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="bid-amount" className="text-xs">Your Bid</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                <Input
                  id="bid-amount"
                  className="pl-7"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="0"
                  inputMode="numeric"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bid-notes" className="text-xs">Notes to Seller (optional)</Label>
              <Textarea
                id="bid-notes"
                value={bidNotes}
                onChange={(e) => setBidNotes(e.target.value)}
                placeholder="Pickup logistics, payment terms, conditions of sale…"
                rows={3}
              />
            </div>
            <div className="text-[10px] text-muted-foreground bg-muted/40 rounded-md p-2">
              Phase 1 reminder: Autocurb does not handle payment or title transfer.
              Once a bid is accepted, you and the seller settle directly.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBidTarget(null)}>Cancel</Button>
            <Button onClick={handlePlaceBid} disabled={savingBid}>
              {savingBid ? "Placing…" : "Place Bid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WholesaleMarketplace;
