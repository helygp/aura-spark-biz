import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY = "https://services.aurabr.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } =
      await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub;

    const body = await req.json().catch(() => ({}));
    const { business_id, action, agent_active } = body ?? {};

    if (!business_id || typeof business_id !== "string") {
      return json({ error: "business_id is required" }, 400);
    }
    if (action !== "get" && action !== "toggle") {
      return json({ error: "action must be 'get' or 'toggle'" }, 400);
    }

    // Authorize: user must own the business OR be a member
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: biz } = await admin
      .from("businesses")
      .select("id, owner_id")
      .eq("id", business_id)
      .maybeSingle();

    let authorized = biz?.owner_id === userId;
    if (!authorized) {
      const { data: mem } = await admin
        .from("business_members")
        .select("user_id")
        .eq("business_id", business_id)
        .eq("user_id", userId)
        .maybeSingle();
      authorized = !!mem;
    }
    if (!authorized) return json({ error: "Forbidden" }, 403);

    const adminKey = Deno.env.get("AURASERVICES_ADMIN_KEY");
    if (!adminKey) return json({ error: "Gateway key not configured" }, 500);

    const url = `${GATEWAY}/admin/businesses/${business_id}/agent-active`;
    const gwRes =
      action === "get"
        ? await fetch(url, { headers: { "X-Admin-Key": adminKey } })
        : await fetch(url, {
            method: "PATCH",
            headers: {
              "X-Admin-Key": adminKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ agent_active: !!agent_active }),
          });

    const text = await gwRes.text();
    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }

    return new Response(JSON.stringify(payload), {
      status: gwRes.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}