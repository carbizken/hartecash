import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(JSON.stringify({ error: "Firecrawl not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log("Scraping dealer site:", formattedUrl);

    // Step 1: Scrape with Firecrawl (markdown + branding)
    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown", "branding", "links"],
        onlyMainContent: false,
      }),
    });

    const scrapeData = await scrapeRes.json();
    if (!scrapeRes.ok) {
      console.error("Firecrawl error:", scrapeData);
      return new Response(
        JSON.stringify({ error: "Failed to scrape website", detail: scrapeData.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
    const branding = scrapeData.data?.branding || scrapeData.branding || {};
    const links = scrapeData.data?.links || scrapeData.links || [];
    const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};

    // Step 2: Use AI to extract structured dealer info
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert at extracting dealership information from website content. Extract all available information and return it using the provided tool.`,
          },
          {
            role: "user",
            content: `Extract dealership information from this website content.

WEBSITE URL: ${formattedUrl}
PAGE TITLE: ${metadata.title || ""}

BRANDING DATA:
${JSON.stringify(branding, null, 2)}

LINKS FOUND:
${links.slice(0, 50).join("\n")}

PAGE CONTENT (first 8000 chars):
${markdown.slice(0, 8000)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_dealer_info",
              description: "Extract structured dealership information from website content",
              parameters: {
                type: "object",
                properties: {
                  dealership_name: { type: "string", description: "Full dealership name" },
                  tagline: { type: "string", description: "Tagline or slogan if found" },
                  phone: { type: "string", description: "Main phone number" },
                  email: { type: "string", description: "Main contact email" },
                  address: { type: "string", description: "Full street address" },
                  website: { type: "string", description: "Website URL" },
                  google_review: { type: "string", description: "Google review/maps URL if found" },
                  facebook: { type: "string", description: "Facebook page URL" },
                  instagram: { type: "string", description: "Instagram URL" },
                  tiktok: { type: "string", description: "TikTok URL" },
                  youtube: { type: "string", description: "YouTube channel URL" },
                  primary_color: { type: "string", description: "Primary brand color as hex (e.g. #1e3a5f)" },
                  accent_color: { type: "string", description: "Accent/secondary color as hex" },
                  logo_url: { type: "string", description: "URL to the dealership logo image" },
                  oem_brands: {
                    type: "array",
                    items: { type: "string" },
                    description: "Car brands/makes sold (e.g. Toyota, Honda, Ford)",
                  },
                  locations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        address: { type: "string" },
                        city_state_zip: { type: "string" },
                        brands: { type: "string" },
                      },
                    },
                    description: "Individual store locations if multi-location",
                  },
                  business_hours: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        days: { type: "string", description: "e.g. Mon-Fri" },
                        hours: { type: "string", description: "e.g. 9:00 AM - 7:00 PM" },
                      },
                    },
                    description: "Business hours",
                  },
                  architecture: {
                    type: "string",
                    enum: ["Single Store", "Multi-Location", "Dealer Group"],
                    description: "Inferred store architecture based on number of locations/brands",
                  },
                },
                required: ["dealership_name"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_dealer_info" } },
      }),
    });

    if (!aiRes.ok) {
      const aiErr = await aiRes.text();
      console.error("AI error:", aiRes.status, aiErr);
      return new Response(
        JSON.stringify({ error: "AI extraction failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let extracted = {};

    if (toolCall?.function?.arguments) {
      try {
        extracted = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error("Failed to parse AI response");
      }
    }

    console.log("Extracted dealer info:", JSON.stringify(extracted).slice(0, 500));

    return new Response(
      JSON.stringify({ success: true, data: extracted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("scrape-dealer-site error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
