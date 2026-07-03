import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-agent-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const agentKey = req.headers.get("x-agent-key") ?? req.headers.get("X-Agent-Key");
  const expected = Deno.env.get("WHATSAPP_AGENT_KEY");
  if (!expected || !agentKey || agentKey !== expected) {
    return json({ error: "unauthorized" }, 401);
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }

  const business_id = String(body.business_id ?? "");
  if (!business_id) return json({ error: "missing_fields", message: "business_id é obrigatório" }, 400);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: business, error: bizErr } = await admin
    .from("businesses")
    .select("id, name")
    .eq("id", business_id)
    .maybeSingle();
  if (bizErr) return json({ error: "db_error", message: bizErr.message }, 500);
  if (!business) return json({ error: "business_not_found", message: "Negócio não encontrado" }, 404);

  const [{ data: services, error: svcErr }, { data: professionals, error: proErr }] = await Promise.all([
    admin.from("services")
      .select("id, name, duration_minutes, price, is_active")
      .eq("business_id", business_id)
      .eq("is_active", true)
      .order("name"),
    admin.from("professionals")
      .select("id, name, is_active")
      .eq("business_id", business_id)
      .eq("is_active", true)
      .order("name"),
  ]);
  if (svcErr) return json({ error: "db_error", message: svcErr.message }, 500);
  if (proErr) return json({ error: "db_error", message: proErr.message }, 500);

  return json({
    business_id: business.id,
    business_name: business.name,
    services: services ?? [],
    professionals: professionals ?? [],
  });
});