# App Switcher Wiring Guide for Lovable

> Copy-paste this into each of the 4 Lovable apps (Autocurb, Clear Deal, AutoFrame, Video MPI) so they all share a unified platform switcher bar at the top.

---

## Architecture Overview

```
PlatformHeader (32px dark bar at the top of every app)
  ├── AppSwitcher (popover grid showing all 4 products)
  ├── Inline product tabs (desktop only, lg+ breakpoint)
  └── Dealer name + plan badge (right side)

PlatformProvider (React context wrapping the admin layout)
  ├── Fetches products, bundles, and dealer subscription from Supabase
  ├── Exposes `hasProduct(id)` to gate access
  └── Exposes `activeProducts`, `subscription`, `bundles`
```

**Navigation between apps uses `window.location.href`** — each app is a separate deployment, so clicking a different product does a full-page redirect to that product's `base_url`.

---

## Step 1 — Supabase Tables (already created)

These tables already exist in the database. Each Lovable app just needs to **read** from them.

### `platform_products`

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | `autocurb`, `cleardeal`, `autoframe`, `video_mpi` |
| `name` | text | Display name |
| `description` | text | One-liner description |
| `icon_name` | text | Lucide icon name: `Car`, `FileCheck`, `Camera`, `Video` |
| `base_url` | text | Full URL for that app |
| `is_active` | boolean | Whether the product is live |
| `sort_order` | int | Display order (1-4) |

### `platform_bundles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | `starter`, `growth`, `enterprise` |
| `name` | text | Plan display name |
| `description` | text | Plan tagline |
| `monthly_price` | numeric | Price in cents (1495 = $14.95) |
| `annual_price` | numeric | Annual price in cents (nullable) |
| `product_ids` | text[] | Array of product IDs included |
| `is_featured` | boolean | Highlight badge ("Most Popular") |
| `sort_order` | int | Display order |

### `dealer_subscriptions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | Auto-generated |
| `dealership_id` | uuid | FK to dealerships table |
| `bundle_id` | text FK | References `platform_bundles.id` |
| `product_ids` | text[] | **Actual active products** for this dealer |
| `status` | text | `active`, `trial`, `suspended`, `cancelled` |
| `trial_ends_at` | timestamptz | Nullable — set when on trial |
| `billing_cycle` | text | `monthly` or `annual` |
| `monthly_amount` | numeric | What they actually pay |
| `started_at` | timestamptz | Subscription start |

### Seeded data

```sql
-- Products
('autocurb', 'Autocurb', 'Off-street vehicle acquisition — instant offers, inspections, appraisals', 'Car', 'https://autocurb.io', 1)
('cleardeal', 'Clear Deal', 'Window stickers & FTC-compliant addendum signing platform', 'FileCheck', 'https://cleardeal.autocurb.io', 2)
('autoframe', 'AutoFrame', 'AI-powered vehicle photography — background removal, consistent lighting', 'Camera', 'https://autoframe.autocurb.io', 3)
('video_mpi', 'Video MPI', 'Customer video walkarounds & multi-point inspection for service', 'Video', 'https://video.autocurb.io', 4)

-- Bundles
('starter',    'Starter',    $14.95/mo, [autocurb, cleardeal])
('growth',     'Growth',     $16.95/mo, [autocurb, cleardeal, autoframe])        -- featured
('enterprise', 'Enterprise', $19.95/mo, [autocurb, cleardeal, autoframe, video_mpi])
```

---

## Step 2 — PlatformContext (React Context Provider)

Create this file in each Lovable app. It fetches all platform data from Supabase and exposes it to the header/switcher.

### `src/contexts/PlatformContext.tsx`

```tsx
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

// ── Types ──────────────────────────────────────────────

export interface PlatformProduct {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  base_url: string;
  is_active: boolean;
  sort_order: number;
}

export interface PlatformBundle {
  id: string;
  name: string;
  description: string;
  monthly_price: number;
  annual_price: number | null;
  product_ids: string[];
  is_featured: boolean;
  sort_order: number;
}

export interface DealerSubscription {
  id: string;
  bundle_id: string | null;
  product_ids: string[];
  status: string;
  trial_ends_at: string | null;
  billing_cycle: string;
  monthly_amount: number | null;
}

interface PlatformContextValue {
  products: PlatformProduct[];
  bundles: PlatformBundle[];
  activeProducts: string[];
  currentProduct: string;
  hasProduct: (productId: string) => boolean;
  subscription: DealerSubscription | null;
  loading: boolean;
}

const PlatformContext = createContext<PlatformContextValue>({
  products: [],
  bundles: [],
  activeProducts: [],
  currentProduct: "autocurb",       // <── CHANGE per app (see Step 5)
  hasProduct: () => false,
  subscription: null,
  loading: true,
});

export const usePlatform = () => useContext(PlatformContext);

// ── Provider ───────────────────────────────────────────

interface PlatformProviderProps {
  children: ReactNode;
  currentApp: string;           // <── passed in from the app's layout
  dealershipId: string;         // <── from your auth/tenant context
}

export const PlatformProvider = ({ children, currentApp, dealershipId }: PlatformProviderProps) => {
  const [products, setProducts] = useState<PlatformProduct[]>([]);
  const [bundles, setBundles] = useState<PlatformBundle[]>([]);
  const [subscription, setSubscription] = useState<DealerSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchPlatformData = async () => {
      try {
        const [productsRes, bundlesRes, subRes] = await Promise.all([
          supabase
            .from("platform_products")
            .select("id, name, description, icon_name, base_url, is_active, sort_order")
            .order("sort_order"),
          supabase
            .from("platform_bundles")
            .select("id, name, description, monthly_price, annual_price, product_ids, is_featured, sort_order")
            .order("sort_order"),
          supabase
            .from("dealer_subscriptions")
            .select("id, bundle_id, product_ids, status, trial_ends_at, billing_cycle, monthly_amount")
            .eq("dealership_id", dealershipId)
            .maybeSingle(),
        ]);

        if (cancelled) return;

        if (productsRes.data) setProducts(productsRes.data as PlatformProduct[]);
        if (bundlesRes.data) setBundles(bundlesRes.data as PlatformBundle[]);
        if (subRes.data) setSubscription(subRes.data as DealerSubscription);
      } catch (err) {
        console.error("Failed to fetch platform data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPlatformData();
    return () => { cancelled = true; };
  }, [dealershipId]);

  const activeProducts = subscription?.product_ids ?? [];

  const hasProduct = useCallback(
    (productId: string) => activeProducts.includes(productId),
    [activeProducts],
  );

  return (
    <PlatformContext.Provider
      value={{
        products,
        bundles,
        activeProducts,
        currentProduct: currentApp,
        hasProduct,
        subscription,
        loading,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};
```

---

## Step 3 — AppSwitcher Component (Popover)

### `src/components/platform/AppSwitcher.tsx`

```tsx
import { Car, FileCheck, Camera, Video, Lock, ChevronDown, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePlatform } from "@/contexts/PlatformContext";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const ICON_MAP: Record<string, React.ElementType> = {
  Car,
  FileCheck,
  Camera,
  Video,
};

interface AppSwitcherProps {
  currentApp?: string;
}

const AppSwitcher = ({ currentApp = "autocurb" }: AppSwitcherProps) => {
  const { products, activeProducts, hasProduct, subscription, bundles } = usePlatform();
  const [open, setOpen] = useState(false);

  const currentProductData = products.find((p) => p.id === currentApp);
  const CurrentIcon = currentProductData ? ICON_MAP[currentProductData.icon_name] || Car : Car;
  const currentBundle = bundles.find((b) => b.id === subscription?.bundle_id);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-200 hover:bg-white/10 active:scale-[0.97] group">
          <div className="w-6 h-6 rounded-md bg-white/15 flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <CurrentIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-white/90 hidden sm:inline">
            {currentProductData?.name || "Autocurb"}
          </span>
          <ChevronDown className={`w-3 h-3 text-white/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[360px] p-0 border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/20 rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/50">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Autocurb Platform
          </p>
        </div>

        {/* Product Grid — 2 columns */}
        <div className="p-2 grid grid-cols-2 gap-1.5">
          {products
            .filter((p) => p.is_active)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((product) => {
              const Icon = ICON_MAP[product.icon_name] || Car;
              const isActive = hasProduct(product.id);
              const isCurrent = product.id === currentApp;

              return (
                <button
                  key={product.id}
                  onClick={() => {
                    if (isActive && !isCurrent) {
                      // Full-page redirect to the other app
                      window.location.href = product.base_url;
                    }
                    if (isCurrent) {
                      setOpen(false);
                    }
                  }}
                  disabled={!isActive}
                  className={`
                    relative flex flex-col items-start gap-2 p-3 rounded-lg text-left transition-all duration-200
                    ${isCurrent
                      ? "bg-primary/10 border border-primary/30 shadow-sm"
                      : isActive
                        ? "hover:bg-muted/80 border border-transparent hover:border-border/50 cursor-pointer"
                        : "opacity-50 border border-transparent cursor-default"
                    }
                  `}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        isCurrent
                          ? "bg-primary text-primary-foreground shadow-md"
                          : isActive
                            ? "bg-muted text-foreground"
                            : "bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {/* Lock icon for unsubscribed products */}
                    {!isActive && (
                      <Lock className="w-3 h-3 text-muted-foreground/60" />
                    )}
                    {/* Pulsing dot for current app */}
                    {isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <p className={`text-xs font-semibold leading-tight ${isCurrent ? "text-primary" : "text-foreground"}`}>
                      {product.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  {/* Upgrade badge for locked products */}
                  {!isActive && (
                    <span className="text-[9px] font-medium text-muted-foreground/70 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      Upgrade to unlock
                    </span>
                  )}
                </button>
              );
            })}
        </div>

        {/* Footer — Current Plan + Upgrade link */}
        <div className="px-4 py-2.5 border-t border-border/50 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Current plan:</span>
            <Badge variant="secondary" className="text-[10px] h-5 font-semibold">
              {currentBundle?.name || "No Plan"}
            </Badge>
          </div>
          {activeProducts.length < products.filter((p) => p.is_active).length && (
            <span
              className="text-[10px] text-primary font-semibold cursor-pointer hover:underline"
              onClick={() => {
                // Navigate to upgrade page — see Step 6
                window.location.href = "https://autocurb.io/admin?section=platform-billing";
              }}
            >
              Upgrade
            </span>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AppSwitcher;
```

---

## Step 4 — PlatformHeader Component (32px top bar)

### `src/components/platform/PlatformHeader.tsx`

```tsx
import { Car, FileCheck, Camera, Video, Lock } from "lucide-react";
import { usePlatform } from "@/contexts/PlatformContext";
import { Badge } from "@/components/ui/badge";
import AppSwitcher from "./AppSwitcher";

const ICON_MAP: Record<string, React.ElementType> = {
  Car,
  FileCheck,
  Camera,
  Video,
};

interface PlatformHeaderProps {
  dealerName?: string;
  currentApp: string;       // <── "autocurb" | "cleardeal" | "autoframe" | "video_mpi"
}

const PlatformHeader = ({ dealerName, currentApp }: PlatformHeaderProps) => {
  const { products, hasProduct, subscription, bundles } = usePlatform();
  const currentBundle = bundles.find((b) => b.id === subscription?.bundle_id);

  return (
    <div className="relative z-[60] w-full h-8 bg-[#0f0f12] border-b border-white/[0.06] select-none">
      {/* Subtle gradient shine */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent pointer-events-none" />

      <div className="relative h-full px-3 flex items-center justify-between gap-4">
        {/* Left — Platform logo + App switcher */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 shrink-0 hidden md:inline">
            Autocurb
          </span>
          <div className="hidden md:block h-3.5 w-px bg-white/10" />
          <AppSwitcher currentApp={currentApp} />
        </div>

        {/* Center — Inline product tabs (desktop only) */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {products
            .filter((p) => p.is_active)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((product) => {
              const Icon = ICON_MAP[product.icon_name] || Car;
              const isActive = hasProduct(product.id);
              const isCurrent = product.id === currentApp;

              return (
                <button
                  key={product.id}
                  onClick={() => {
                    if (isActive && !isCurrent) {
                      window.location.href = product.base_url;
                    }
                  }}
                  disabled={!isActive}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150
                    ${isCurrent
                      ? "bg-white/10 text-white shadow-sm"
                      : isActive
                        ? "text-white/50 hover:text-white/80 hover:bg-white/[0.05] cursor-pointer"
                        : "text-white/20 cursor-default"
                    }
                  `}
                >
                  <Icon className="w-3 h-3" />
                  <span>{product.name}</span>
                  {!isActive && <Lock className="w-2.5 h-2.5 ml-0.5 opacity-50" />}
                </button>
              );
            })}
        </nav>

        {/* Right — Dealer name + plan badge */}
        <div className="flex items-center gap-2 shrink-0">
          {dealerName && (
            <span className="text-[10px] text-white/40 font-medium truncate max-w-[120px] hidden sm:inline">
              {dealerName}
            </span>
          )}
          {currentBundle && (
            <Badge
              variant="outline"
              className="text-[9px] h-4 px-1.5 font-semibold border-white/10 text-white/50 bg-white/[0.04]"
            >
              {currentBundle.name}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlatformHeader;
```

---

## Step 5 — Wiring Into Each App's Layout

### The only thing that changes per app is the `currentApp` prop.

In each app's **main admin/dashboard layout**, wrap the page content with `PlatformProvider` and render `PlatformHeader` at the top:

### App 1: Autocurb (`autocurb.io`)

```tsx
// In your main admin layout (e.g., AdminDashboard.tsx or Layout.tsx)
import { PlatformProvider } from "@/contexts/PlatformContext";
import PlatformHeader from "@/components/platform/PlatformHeader";

const AdminLayout = ({ children }) => {
  const dealershipId = "..."; // from your auth/tenant context
  const dealerName = "...";   // from your tenant context

  return (
    <PlatformProvider currentApp="autocurb" dealershipId={dealershipId}>
      <PlatformHeader currentApp="autocurb" dealerName={dealerName} />
      {/* rest of the app (sidebar, content, etc.) */}
      {children}
    </PlatformProvider>
  );
};
```

### App 2: Clear Deal (`cleardeal.autocurb.io`)

```tsx
<PlatformProvider currentApp="cleardeal" dealershipId={dealershipId}>
  <PlatformHeader currentApp="cleardeal" dealerName={dealerName} />
  {children}
</PlatformProvider>
```

### App 3: AutoFrame (`autoframe.autocurb.io`)

```tsx
<PlatformProvider currentApp="autoframe" dealershipId={dealershipId}>
  <PlatformHeader currentApp="autoframe" dealerName={dealerName} />
  {children}
</PlatformProvider>
```

### App 4: Video MPI (`video.autocurb.io`)

```tsx
<PlatformProvider currentApp="video_mpi" dealershipId={dealershipId}>
  <PlatformHeader currentApp="video_mpi" dealerName={dealerName} />
  {children}
</PlatformProvider>
```

---

## Step 6 — Upgrade Flow (When Customer Doesn't Have an App)

When a dealer's subscription doesn't include a product, the UI handles it in 3 places:

### 6a. In the AppSwitcher popover

- Locked products show a **Lock icon** and **"Upgrade to unlock"** badge
- The button is `disabled` so they can't navigate
- The footer shows an **"Upgrade"** link if they don't have all products

### 6b. In the PlatformHeader inline tabs (desktop)

- Locked products appear **dimmed** (`text-white/20`) with a tiny Lock icon
- The button is `disabled`

### 6c. Dedicated Upgrade Page (recommended approach)

The best pattern: when the "Upgrade" link is clicked, redirect to the **Autocurb admin** where the Platform & Billing section (`PlatformSubscriptions` component) already exists. This keeps billing centralized in one place.

**Upgrade link target:**
```
https://autocurb.io/admin?section=platform-billing
```

### Full Upgrade/Upsell Component (already built)

The `PlatformSubscriptions` component at `src/components/admin/PlatformSubscriptions.tsx` handles:

1. **Current Plan display** — shows the active bundle, status badge (Active/Trial/Suspended), billing cycle, and monthly amount
2. **Active Products list** — shows all 4 products with checkmarks for included ones and locks for excluded ones
3. **Trial period notice** — yellow banner with expiry date if on trial
4. **No Subscription state** — empty state with "Choose a plan below" CTA
5. **Compare Plans grid** — side-by-side cards for Starter / Growth / Enterprise with:
   - Monthly price and annual discount percentage
   - Product feature checklist (check vs lock)
   - Enterprise extras (DMS Integration, Priority Support)
   - "Current Plan" / "Select Plan" buttons
   - "Most Popular" badge on Growth (featured)
6. **Plan change confirmation** — bottom banner: "Switch to [Plan]? Payment processing via Stripe is coming soon."

### Best Practice: Centralized Billing

Rather than building billing UI in all 4 apps, keep it in **Autocurb only** (the "home base" app). The other 3 apps should:

1. Show the upgrade link in the AppSwitcher footer → redirects to `https://autocurb.io/admin?section=platform-billing`
2. Optionally show a small "Upgrade" banner in their own settings page that also redirects to the same URL

This way you only maintain billing/subscription management in one place.

---

## Step 7 — Checklist for Each Lovable App

Use this checklist when wiring up each app:

- [ ] **Supabase client** — ensure the app has `@supabase/supabase-js` configured and can read `platform_products`, `platform_bundles`, `dealer_subscriptions`
- [ ] **Create `PlatformContext.tsx`** — copy from Step 2, pass `currentApp` and `dealershipId` as props
- [ ] **Create `AppSwitcher.tsx`** — copy from Step 3
- [ ] **Create `PlatformHeader.tsx`** — copy from Step 4
- [ ] **Wire into layout** — wrap admin layout with `PlatformProvider`, render `PlatformHeader` at the top (Step 5)
- [ ] **Set `currentApp`** — use the correct product ID for this app:
  - `"autocurb"` for Autocurb
  - `"cleardeal"` for Clear Deal
  - `"autoframe"` for AutoFrame
  - `"video_mpi"` for Video MPI
- [ ] **Shadcn/ui dependencies** — ensure `Popover`, `Badge` components are installed (`npx shadcn-ui add popover badge`)
- [ ] **Lucide icons** — ensure `lucide-react` is installed
- [ ] **Upgrade link** — points to `https://autocurb.io/admin?section=platform-billing`
- [ ] **Test** — verify the header renders, current app is highlighted, locked products show lock icon, clicking an active product navigates to the correct URL

---

## Dependencies Required

```bash
npm install lucide-react @supabase/supabase-js
npx shadcn-ui add popover badge
```

---

## Visual Reference

```
┌─────────────────────────────────────────────────────────────────┐
│ AUTOCURB │ [🚗 Autocurb ▾]   🚗Autocurb  📄ClearDeal  📷AutoFrame  🎥VideoMPI🔒   Acme Motors │ Growth │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  (rest of the app below the 32px header bar)                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Popover (when clicking the switcher):
┌─────────────────────────────┐
│  AUTOCURB PLATFORM          │
├──────────────┬──────────────┤
│ 🚗 Autocurb  │ 📄 Clear Deal│
│ (active/cur) │ (active)     │
├──────────────┼──────────────┤
│ 📷 AutoFrame │ 🎥 Video MPI │
│ (active)     │ 🔒 Upgrade   │
├──────────────┴──────────────┤
│ Plan: Growth      [Upgrade] │
└─────────────────────────────┘
```
