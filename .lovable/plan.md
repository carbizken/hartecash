## Pre-Launch Tenant Decoupling & Polish

### 1. De-hardcode "Harte" logo fallbacks (16 files)
All files import `harte-logo.png` or `harte-logo-white.png` as fallback logos. These should use `config.logo_url` / `config.logo_white_url` with a **generic** fallback (text-based dealer name) instead of a Harte-specific image. Files affected:
- SiteHeader, SubmissionSuccess, OfferDisclosure, UploadDocs, OfferPage, ScheduleVisit, AdminHeader, UploadPhotos, CustomerPortal, AdminLogin, TermsOfService, PrivacyPolicy, DealAccepted, SubmissionDetailSheet, Sitemap, PitchDeck

### 2. De-hardcode default config strings
- `useSiteConfig.ts` defaults: Change `"Harte Auto Group"` → `"Our Dealership"`, update about_hero defaults to generic text
- `TenantContext.tsx`: Change default display_name from `"Harte Auto Group"` → `"AutoCurb"` (platform name)
- `SEO.tsx`: Change hardcoded `BASE_URL` from hartecash.lovable.app → use `window.location.origin` dynamically
- `printUtils.ts`: Change "Harte Auto Group" fallback → use passed dealer name or generic

### 3. De-hardcode edge function store locations
- `send-reschedule-notification` and `send-appointment-confirmation`: Replace hardcoded `STORE_LOCATIONS` map with a DB lookup from `dealership_locations` table

### 4. Footer hardcoded color
- `SiteFooter.tsx` line 34: `bg-[hsl(220,13%,18%)]` should use a semantic token

### 5. QR code logo in SubmissionSuccess
- Currently imports `harte-logo.png` for QR overlay — should use `config.logo_url`

**Not changing**: KenPage.tsx (personal pitch deck, intentionally Harte-specific)
