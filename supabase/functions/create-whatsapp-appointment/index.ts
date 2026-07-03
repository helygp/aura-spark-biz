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

function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}:00`;
}

function normalizeTime(hhmm: string): string {
  const parts = hhmm.split(":");
  const h = String(Number(parts[0])).padStart(2, "0");
  const m = String(Number(parts[1])).padStart(2, "0");
  return `${h}:${m}:00`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    console.warn("[wa-appt] method_not_allowed", { method: req.method });
    return json({ error: "method_not_allowed" }, 405);
  }

  const agentKey = req.headers.get("x-agent-key") ?? req.headers.get("X-Agent-Key");
  const expected = Deno.env.get("WHATSAPP_AGENT_KEY");
  if (!expected || !agentKey || agentKey !== expected) {
    console.warn("[wa-appt] unauthorized", {
      has_expected: !!expected,
      has_agent_key: !!agentKey,
      key_match: !!expected && !!agentKey && agentKey === expected,
    });
    return json({ error: "unauthorized" }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    console.error("[wa-appt] invalid_json");
    return json({ error: "invalid_json" }, 400);
  }
  console.log("[wa-appt] request", { body });

  const business_id = String(body.business_id ?? "");
  const client_name = String(body.client_name ?? "").trim();
  const client_phone_raw = String(body.client_phone ?? "").trim();
  // Strip WhatsApp ID suffixes like @lid, @s.whatsapp.net, @c.us
  const client_phone = client_phone_raw.split("@")[0].trim();
  if (client_phone !== client_phone_raw) {
    console.log("[wa-appt] phone_sanitized", { raw: client_phone_raw, clean: client_phone });
  }
  const service_id = String(body.service_id ?? "");
  const date = String(body.date ?? "");
  const start_time_raw = String(body.start_time ?? "");
  const professional_id = body.professional_id ? String(body.professional_id) : null;

  if (!business_id || !client_name || !client_phone || !service_id || !date || !start_time_raw) {
    console.warn("[wa-appt] missing_fields", {
      business_id: !!business_id, client_name: !!client_name, client_phone: !!client_phone,
      service_id: !!service_id, date: !!date, start_time: !!start_time_raw,
    });
    return json({ error: "missing_fields", message: "business_id, client_name, client_phone, service_id, date, start_time são obrigatórios" }, 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.warn("[wa-appt] invalid_date", { date });
    return json({ error: "invalid_date", message: "date deve estar no formato YYYY-MM-DD" }, 400);
  }
  if (!/^\d{1,2}:\d{2}$/.test(start_time_raw)) {
    console.warn("[wa-appt] invalid_time", { start_time_raw });
    return json({ error: "invalid_time", message: "start_time deve estar no formato HH:MM" }, 400);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 1. Load service
  const { data: service, error: serviceErr } = await admin
    .from("services")
    .select("id, business_id, duration_minutes, price, name")
    .eq("id", service_id)
    .maybeSingle();
  if (serviceErr) return json({ error: "db_error", message: serviceErr.message }, 500);
  if (!service) return json({ error: "service_not_found", message: "Serviço não encontrado" }, 404);
  if (service.business_id !== business_id) {
    console.warn("[wa-appt] service_business_mismatch", {
      received_business_id: business_id,
      service_business_id: service.business_id,
      service_id,
    });
    return json({ error: "service_business_mismatch", message: "Serviço não pertence a esse negócio" }, 400);
  }

  const start_time = normalizeTime(start_time_raw);
  const end_time = addMinutes(start_time_raw, service.duration_minutes);

  // 2. Resolve or create client
  const { data: existingClient, error: clientQueryErr } = await admin
    .from("clients")
    .select("id, name")
    .eq("business_id", business_id)
    .eq("phone", client_phone)
    .maybeSingle();
  if (clientQueryErr) return json({ error: "db_error", message: clientQueryErr.message }, 500);

  let clientId: string;
  if (existingClient) {
    clientId = existingClient.id;
  } else {
    const { data: created, error: createClientErr } = await admin
      .from("clients")
      .insert({
        business_id,
        name: client_name,
        phone: client_phone,
      })
      .select("id")
      .single();
    if (createClientErr) return json({ error: "client_create_failed", message: createClientErr.message }, 500);
    clientId = created.id;
  }

  // 3. Conflict check
  let conflictQuery = admin
    .from("appointments")
    .select("id, start_time, end_time, professional_id, status")
    .eq("business_id", business_id)
    .eq("date", date)
    .not("status", "in", "(cancelled,no_show)")
    .lt("start_time", end_time)
    .gt("end_time", start_time);

  if (professional_id) {
    conflictQuery = conflictQuery.eq("professional_id", professional_id);
  }

  const { data: conflicts, error: conflictErr } = await conflictQuery;
  if (conflictErr) return json({ error: "db_error", message: conflictErr.message }, 500);
  if (conflicts && conflicts.length > 0) {
    return json(
      {
        error: "slot_unavailable",
        message: "Horário indisponível. Já existe um agendamento nesse horário.",
      },
      409,
    );
  }

  // 3b. Time-off (professional unavailability) check
  let timeOffQuery = admin
    .from("professional_time_off")
    .select("id, start_time, end_time, professional_id, reason")
    .eq("business_id", business_id)
    .eq("date", date)
    .lt("start_time", end_time)
    .gt("end_time", start_time);
  if (professional_id) {
    timeOffQuery = timeOffQuery.eq("professional_id", professional_id);
  }
  const { data: timeOffs, error: timeOffErr } = await timeOffQuery;
  if (timeOffErr) return json({ error: "db_error", message: timeOffErr.message }, 500);
  if (timeOffs && timeOffs.length > 0) {
    console.log("[wa-appt] blocked_by_time_off", { count: timeOffs.length });
    return json(
      {
        error: "professional_unavailable",
        message: "O profissional está indisponível nesse horário.",
      },
      409,
    );
  }

  // 4. Insert appointment
  const { data: appointment, error: apptErr } = await admin
    .from("appointments")
    .insert({
      business_id,
      client_id: clientId,
      service_id,
      professional_id,
      date,
      start_time,
      end_time,
      price: service.price,
      status: "scheduled",
      source: "whatsapp",
    })
    .select(
      "id, business_id, client_id, service_id, professional_id, date, start_time, end_time, price, status, source",
    )
    .single();
  if (apptErr) return json({ error: "appointment_create_failed", message: apptErr.message }, 500);

  return json({ ok: true, appointment, service: { id: service.id, name: service.name } }, 201);
});