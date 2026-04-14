// widget-config
// ---------------------------------------------------------------------------
// Public endpoint that returns widget appearance settings for a dealership.
// Called by embed.js on the dealer's website so colors, text, and position
// can be changed from the HarteCash admin panel without updating the snippet.
//
// GET /widget-config?dealership_id=<id>[&store=<location_id>]
//
// Response: JSON object with widget config fields.
// Cached for 5 minutes via Cache-Control header to keep it fast.
// ---------------------------------------------------------------------------

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// Only return these fields — nothing sensitive
const WIDGET_FIELDS = [
  "widget_button_text",
  "widget_button_color",
  "widget_position",
  "widget_open_mode",
  "widget_drawer_title",
  "widget_sticky_enabled",
  "widget_sticky_text",
  "widget_sticky_cta",
  "widget_sticky_position",
  "widget_promo_text",
  "dealership_name",
  "primary_color",
  "ppt_enabled",
  "ppt_guarantee_amount",
] as const;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const dealershipId = url.searchParams.get("dealership_id");
  const storeId = url.searchParams.get("store");

  if (!dealershipId) {
    return new Response(
      JSON.stringify({ error: "dealership_id is required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Fetch corporate config
  const { data: corpData, error: corpError } = await supabase
    .from("site_config")
    .select(WIDGET_FIELDS.join(","))
    .eq("dealership_id", dealershipId)
    .maybeSingle();

  if (corpError) {
    return new Response(JSON.stringify({ error: "Config not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let config = corpData || {};

  // If a store/location is specified, merge location overrides
  if (storeId) {
    const { data: locData } = await supabase
      .from("dealership_locations")
      .select(WIDGET_FIELDS.join(","))
      .eq("id", storeId)
      .maybeSingle();

    if (locData) {
      for (const key of WIDGET_FIELDS) {
        const val = (locData as any)[key];
        if (val !== null && val !== undefined && val !== "") {
          (config as any)[key] = val;
        }
      }
    }
  }

  return new Response(JSON.stringify(config), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300", // 5 min cache
    },
  });
});
