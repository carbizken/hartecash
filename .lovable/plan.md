

## Current Access Points

The inspection sheet lives at `/inspection/:id` and can currently only be reached from:
1. **Offer Page** (`/offer/:token`) — via an "Inspection Sheet" button in the header/footer
2. **Direct URL** — if you know the submission ID

It is **not linked from the Admin Dashboard**, which is where inspectors would most naturally look for it.

## Plan: Add Inspection Sheet Access from Admin Dashboard

### 1. Add "Inspection Sheet" button to the submission detail panel in AdminDashboard
- In the submission detail sidebar/panel (where you see vehicle info, status, notes), add an "Inspection Sheet" button/link
- It will navigate to `/inspection/{submission.id}` (opens in new tab so they don't lose their place)
- Place it near the existing action buttons (Print Offer, etc.)

### 2. Optionally add it to the Admin Sidebar
- Add an "Inspections" or "Inspection Sheet" entry under the Pipeline group, though since it requires a submission ID, it makes more sense as a per-submission action button rather than a sidebar nav item

### Technical Details
- **File to edit**: `src/pages/AdminDashboard.tsx` — add a `Link` or `<a target="_blank">` button in the submission detail panel
- Uses the submission's `id` field to construct `/inspection/${selected.id}`
- Icon: `ClipboardList` or `Search` (already imported)

