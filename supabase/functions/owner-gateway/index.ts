import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY = "https://services.aurabr.app";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function startOfDayIso(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}
function endOfDayIso(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
}
function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}
function startOfWeekMonday(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day + 6) % 7;
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { token, action, params } = body ?? {};

    if (!token || typeof token !== "string") {
      return json({ error: "token is required" }, 400);
    }
    if (!action || typeof action !== "string") {
      return json({ error: "action is required" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: tokenRow, error: tokenErr } = await admin
      .from("owner_api_tokens")
      .select("business_id")
      .eq("token", token)
      .maybeSingle();

    if (tokenErr) return json({ error: tokenErr.message }, 500);
    if (!tokenRow) return json({ error: "Invalid token" }, 401);

    const businessId = tokenRow.business_id as string;

    if (action === "get_dashboard") {
      const today = new Date();
      const todayStr = ymd(today);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthStartStr = ymd(monthStart);

      const [aptsToday, aptsMonth, clientsRes] = await Promise.all([
        admin
          .from("appointments")
          .select("status, price")
          .eq("business_id", businessId)
          .eq("date", todayStr),
        admin
          .from("appointments")
          .select("status, price, date")
          .eq("business_id", businessId)
          .gte("date", monthStartStr)
          .lte("date", todayStr),
        admin
          .from("clients")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId),
      ]);

      const [salesToday, salesMonth] = await Promise.all([
        admin
          .from("sales")
          .select("total")
          .eq("business_id", businessId)
          .gte("created_at", startOfDayIso(today))
          .lte("created_at", endOfDayIso(today)),
        admin
          .from("sales")
          .select("total")
          .eq("business_id", businessId)
          .gte("created_at", startOfDayIso(monthStart))
          .lte("created_at", endOfDayIso(today)),
      ]);

      const activeToday = (aptsToday.data ?? []).filter(
        (a: any) => a.status !== "cancelled" && a.status !== "no_show",
      );
      const revenueToday =
        activeToday.reduce((s: number, a: any) => s + Number(a.price || 0), 0) +
        (salesToday.data ?? []).reduce(
          (s: number, x: any) => s + Number(x.total || 0),
          0,
        );

      const activeMonth = (aptsMonth.data ?? []).filter(
        (a: any) => a.status === "completed",
      );
      const revenueMonth =
        activeMonth.reduce((s: number, a: any) => s + Number(a.price || 0), 0) +
        (salesMonth.data ?? []).reduce(
          (s: number, x: any) => s + Number(x.total || 0),
          0,
        );

      const pendingToday = activeToday.filter(
        (a: any) => a.status === "scheduled" || a.status === "confirmed",
      ).length;

      return json({
        revenue_today: revenueToday,
        revenue_month: revenueMonth,
        pending_today: pendingToday,
        appointments_today: activeToday.length,
        active_clients: clientsRes.count ?? 0,
      });
    }

    if (action === "get_report_summary") {
      const now = new Date();
      const weekStart = startOfWeekMonday(now);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const fromStr = ymd(weekStart);
      const toStr = ymd(weekEnd);

      const [aptsRes, salesRes, hoursRes] = await Promise.all([
        admin
          .from("appointments")
          .select("date, start_time, status, price")
          .eq("business_id", businessId)
          .gte("date", fromStr)
          .lte("date", toStr),
        admin
          .from("sales")
          .select("total, created_at")
          .eq("business_id", businessId)
          .gte("created_at", weekStart.toISOString())
          .lt(
            "created_at",
            new Date(weekEnd.getTime() + 24 * 3600 * 1000).toISOString(),
          ),
        admin
          .from("business_hours")
          .select("weekday, open_time, close_time, is_open")
          .eq("business_id", businessId),
      ]);

      const appointments = aptsRes.data ?? [];
      const sales = salesRes.data ?? [];
      const hours = hoursRes.data ?? [];

      const revenueAppts = appointments
        .filter((a: any) => a.status === "completed")
        .reduce((s: number, a: any) => s + Number(a.price || 0), 0);
      const revenueSales = sales.reduce(
        (s: number, x: any) => s + Number(x.total || 0),
        0,
      );
      const totalRevenue = revenueAppts + revenueSales;

      const completedCount = appointments.filter(
        (a: any) => a.status === "completed",
      ).length;
      const denom = completedCount + sales.length;
      const avgTicket = denom > 0 ? totalRevenue / denom : 0;

      // Approx occupancy: booked (non-cancelled) hours / open hours across week
      let openHoursWeek = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        const h = hours.find((x: any) => x.weekday === d.getDay());
        if (!h || !h.is_open) continue;
        const oh = parseInt(String(h.open_time).slice(0, 2), 10);
        const ch = parseInt(String(h.close_time).slice(0, 2), 10);
        openHoursWeek += Math.max(0, ch - oh);
      }
      const bookedHours = appointments.filter(
        (a: any) => a.status !== "cancelled",
      ).length;
      const occupancy =
        openHoursWeek > 0
          ? Math.min(100, Math.round((bookedHours / openHoursWeek) * 100))
          : 0;

      return json({
        week_from: fromStr,
        week_to: toStr,
        revenue_week: totalRevenue,
        avg_ticket: avgTicket,
        occupancy_rate: occupancy,
        completed_appointments: completedCount,
        sales_count: sales.length,
      });
    }

    if (action === "toggle_agent") {
      const active = !!(params?.active);
      const adminKey = Deno.env.get("AURASERVICES_ADMIN_KEY");
      if (!adminKey) return json({ error: "Gateway key not configured" }, 500);

      const url = `${GATEWAY}/admin/businesses/${businessId}/agent-active`;
      const gwRes = await fetch(url, {
        method: "POST",
        headers: {
          "X-Admin-Key": adminKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: active }),
      });
      const text = await gwRes.text();
      let payload: unknown;
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { raw: text };
      }
      if (!gwRes.ok) {
        return json({ error: "Gateway error", detail: payload }, 502);
      }
      return json({ ok: true, active, gateway: payload });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});