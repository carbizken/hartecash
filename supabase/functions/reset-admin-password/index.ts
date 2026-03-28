import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    "558d8454-079c-42f0-9499-b88e01606639",
    { password: "Summer2026!" }
  );

  return new Response(JSON.stringify({ success: !error, error: error?.message }), {
    headers: { "Content-Type": "application/json" },
  });
});
