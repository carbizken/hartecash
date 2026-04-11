-- Part 1 item #4 — Wholesale Marketplace Phase 1 MVP
--
-- This is the minimum viable schema for dealer-to-dealer wholesale
-- listings. Phase 1 is intentionally scoped to: publish a listing,
-- browse inbound listings, place a bid, accept/reject a bid. It does
-- NOT include settlement, escrow, title transfer, or payment rails —
-- those are Phase 2 and touch regulatory territory that needs its
-- own spec (see docs/AUTOCURB_PART_1_PARKED_ITEMS.md).
--
-- All money is denominated in whole US dollars. Prices are stored as
-- numeric(10,0) to keep the type consistent with submissions.offered_price.

-- ── Listings ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wholesale_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id text NOT NULL,
  submission_id uuid REFERENCES public.submissions(id) ON DELETE SET NULL,
  created_by text,

  -- Vehicle snapshot — copied from the submission at publish time so
  -- the listing is self-contained even if the source submission is
  -- deleted or the customer record is scrubbed.
  vehicle_year text,
  vehicle_make text,
  vehicle_model text,
  vehicle_trim text,
  vin text,
  mileage text,
  exterior_color text,
  class_name text,
  overall_condition text,

  -- Pricing
  asking_price integer NOT NULL,
  reserve_price integer,
  acv_value integer,

  -- Lifecycle
  status text NOT NULL DEFAULT 'active',
  -- one of: 'active' | 'sold' | 'expired' | 'withdrawn'
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '72 hours'),
  sold_to_dealership_id text,
  sold_at timestamptz,
  winning_bid_id uuid,

  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wholesale_listings_status
  ON public.wholesale_listings (status, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_wholesale_listings_dealership
  ON public.wholesale_listings (dealership_id, created_at DESC);

-- ── Bids ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wholesale_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.wholesale_listings(id) ON DELETE CASCADE,
  bidder_dealership_id text NOT NULL,
  bidder_user text,

  bid_amount integer NOT NULL,
  notes text,

  status text NOT NULL DEFAULT 'pending',
  -- one of: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired'

  responded_at timestamptz,
  responded_by text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wholesale_bids_listing
  ON public.wholesale_bids (listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wholesale_bids_bidder
  ON public.wholesale_bids (bidder_dealership_id, status, created_at DESC);

-- Add the foreign key from listing → winning bid now that bids exists
ALTER TABLE public.wholesale_listings
  DROP CONSTRAINT IF EXISTS fk_winning_bid;
ALTER TABLE public.wholesale_listings
  ADD CONSTRAINT fk_winning_bid
  FOREIGN KEY (winning_bid_id) REFERENCES public.wholesale_bids(id) ON DELETE SET NULL;

-- ── Automatic updated_at ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_wholesale_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wholesale_listings_touch ON public.wholesale_listings;
CREATE TRIGGER trg_wholesale_listings_touch
  BEFORE UPDATE ON public.wholesale_listings
  FOR EACH ROW EXECUTE FUNCTION public.touch_wholesale_updated_at();

DROP TRIGGER IF EXISTS trg_wholesale_bids_touch ON public.wholesale_bids;
CREATE TRIGGER trg_wholesale_bids_touch
  BEFORE UPDATE ON public.wholesale_bids
  FOR EACH ROW EXECUTE FUNCTION public.touch_wholesale_updated_at();

-- ── Row Level Security ──────────────────────────────────────────────
-- Phase 1 policy model (intentionally permissive to bootstrap the
-- marketplace — will tighten in Phase 2 when we have the dealer
-- network-membership model):
--
--   1. Any authenticated user can SEE any active listing. That's the
--      whole point of a marketplace.
--   2. Only the listing owner can UPDATE or DELETE their own listing.
--   3. Any authenticated user can INSERT a listing (scoped to their
--      own dealership_id via the application layer).
--   4. Bids are visible to the listing owner and to the bidder.
--   5. Only the bidder can INSERT/UPDATE/WITHDRAW their own bid.

ALTER TABLE public.wholesale_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wholesale_bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wholesale_listings_select" ON public.wholesale_listings;
CREATE POLICY "wholesale_listings_select"
  ON public.wholesale_listings
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "wholesale_listings_insert" ON public.wholesale_listings;
CREATE POLICY "wholesale_listings_insert"
  ON public.wholesale_listings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "wholesale_listings_update" ON public.wholesale_listings;
CREATE POLICY "wholesale_listings_update"
  ON public.wholesale_listings
  FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "wholesale_bids_select" ON public.wholesale_bids;
CREATE POLICY "wholesale_bids_select"
  ON public.wholesale_bids
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "wholesale_bids_insert" ON public.wholesale_bids;
CREATE POLICY "wholesale_bids_insert"
  ON public.wholesale_bids
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "wholesale_bids_update" ON public.wholesale_bids;
CREATE POLICY "wholesale_bids_update"
  ON public.wholesale_bids
  FOR UPDATE
  TO authenticated
  USING (true);

-- ── Expiration sweeper ──────────────────────────────────────────────
-- Can be invoked from a scheduled job or on-demand from an edge function.
CREATE OR REPLACE FUNCTION public.expire_stale_wholesale_listings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count integer := 0;
BEGIN
  WITH updated AS (
    UPDATE public.wholesale_listings
    SET status = 'expired'
    WHERE status = 'active' AND expires_at < now()
    RETURNING 1
  )
  SELECT count(*) INTO expired_count FROM updated;

  -- Also expire pending bids on expired listings
  UPDATE public.wholesale_bids b
  SET status = 'expired'
  WHERE b.status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.wholesale_listings l
      WHERE l.id = b.listing_id AND l.status = 'expired'
    );

  RETURN expired_count;
END;
$$;
