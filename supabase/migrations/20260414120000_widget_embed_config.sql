-- ---------------------------------------------------------------------------
-- Widget Embed Config
-- ---------------------------------------------------------------------------
-- Stores the appearance & behavior settings for the embed.js widget so that
-- dealers can change colors, text, and position from the admin panel without
-- asking their web provider to update the snippet.
-- ---------------------------------------------------------------------------

ALTER TABLE public.site_config
  ADD COLUMN IF NOT EXISTS widget_button_text     text NOT NULL DEFAULT 'Get an Offer in 2 Min',
  ADD COLUMN IF NOT EXISTS widget_button_color    text NOT NULL DEFAULT '#1a365d',
  ADD COLUMN IF NOT EXISTS widget_position        text NOT NULL DEFAULT 'bottom-right',
  ADD COLUMN IF NOT EXISTS widget_open_mode       text NOT NULL DEFAULT 'drawer',
  ADD COLUMN IF NOT EXISTS widget_drawer_title    text NOT NULL DEFAULT 'What''s Your Car Worth?',
  ADD COLUMN IF NOT EXISTS widget_sticky_enabled  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS widget_sticky_text     text NOT NULL DEFAULT 'Have a Trade-In? Get your value in under 2 minutes',
  ADD COLUMN IF NOT EXISTS widget_sticky_cta      text NOT NULL DEFAULT 'Get My Offer',
  ADD COLUMN IF NOT EXISTS widget_sticky_position text NOT NULL DEFAULT 'bottom',
  ADD COLUMN IF NOT EXISTS widget_promo_text      text DEFAULT '';
