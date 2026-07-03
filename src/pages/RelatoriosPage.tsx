import { useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Target,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/hooks/useBusiness";
import { useProfessionals } from "@/hooks/useProfessionals";
import { addDays, format, startOfWeek } from "date-fns";

const BUCKETS = [8, 10, 12, 14, 16, 18];
const FALLBACK_COLORS = [
  "hsl(15, 62%, 48%)",
  "hsl(146, 34%, 37%)",
  "hsl(38, 74%, 42%)",
  "hsl(30, 8%, 25%)",
  "hsl(15, 40%, 62%)",
  "hsl(200, 30%, 40%)",
];
const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default function RelatoriosPage() {
  const { business, isLoading: businessLoading } = useBusiness();
  const { professionals } = useProfessionals();

  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const fromStr = format(weekStart, "yyyy-MM-dd");
  const toStr = format(weekEnd, "yyyy-MM-dd");

  const { data: appointments = [], isLoading: apptsLoading } = useQuery({
    queryKey: ["reports-appointments", business?.id, fromStr, toStr],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("date, start_time, status, price, professional_id, client_id")
        .eq("business_id", business.id)
        .gte("date", fromStr)
        .lte("date", toStr);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!business?.id,
  });

  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ["reports-sales", business?.id, fromStr, toStr],
    queryFn: async () => {
      if (!business?.id) return [];
      const fromIso = weekStart.toISOString();
      const toIso = addDays(weekEnd, 1).toISOString();
      const { data, error } = await supabase
        .from("sales")
        .select("total, professional_id, client_id, created_at")
        .eq("business_id", business.id)
        .gte("created_at", fromIso)
        .lt("created_at", toIso);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!business?.id,
  });

  const { data: hours = [] } = useQuery({
    queryKey: ["reports-hours", business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data, error } = await supabase
        .from("business_hours")
        .select("weekday, open_time, close_time, is_open")
        .eq("business_id", business.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!business?.id,
  });

  const { data: priorClientIds = [] } = useQuery({
    queryKey: ["reports-prior-clients", business?.id, fromStr],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("client_id")
        .eq("business_id", business.id)
        .not("client_id", "is", null)
        .lt("date", fromStr);
      if (error) throw error;
      return (data ?? []).map((r: any) => r.client_id);
    },
    enabled: !!business?.id,
  });

  const isLoading = businessLoading || apptsLoading || salesLoading;

  // Daily revenue (appointments completed + sales) per weekday
  const revenueData = useMemo(() => {
    const perDay = new Array(7).fill(0);
    for (const a of appointments as any[]) {
      if (a.status !== "completed") continue;
      const d = new Date(a.date + "T00:00:00");
      const idx = (d.getDay() + 6) % 7; // Monday=0
      perDay[idx] += Number(a.price ?? 0);
    }
    for (const s of sales as any[]) {
      const d = new Date(s.created_at);
      const idx = (d.getDay() + 6) % 7;
      perDay[idx] += Number(s.total ?? 0);
    }
    return DAY_LABELS.map((name, i) => ({ name, value: perDay[i] }));
  }, [appointments, sales]);

  // Occupancy per hour bucket per professional
  const occupancyData = useMemo(() => {
    // Count days in current week where business is open covering a given bucket
    const openDaysAtBucket = (bucket: number) => {
      let count = 0;
      for (const d of weekDates) {
        const weekday = d.getDay();
        const h = (hours as any[]).find((x) => x.weekday === weekday);
        if (!h || !h.is_open) continue;
        const openH = parseInt(String(h.open_time).slice(0, 2), 10);
        const closeH = parseInt(String(h.close_time).slice(0, 2), 10);
        if (bucket >= openH && bucket < closeH) count++;
      }
      return count;
    };

    return BUCKETS.map((bucket) => {
      const row: Record<string, any> = { name: `${String(bucket).padStart(2, "0")}h` };
      const capacity = Math.max(1, openDaysAtBucket(bucket));
      for (const pro of professionals) {
        const count = (appointments as any[]).filter((a) => {
          if (a.status === "cancelled") return false;
          if (a.professional_id !== pro.id) return false;
          const startH = parseInt(String(a.start_time).slice(0, 2), 10);
          return startH >= bucket && startH < bucket + 2;
        }).length;
        row[pro.name] = Math.min(100, Math.round((count / capacity) * 100));
      }
      return row;
    });
  }, [appointments, hours, professionals, weekDates]);

  // Per-professional performance
  const proPerformance = useMemo(() => {
    return professionals.map((pro) => {
      const proAppts = (appointments as any[]).filter(
        (a) => a.professional_id === pro.id && a.status === "completed"
      );
      const proSales = (sales as any[]).filter((s) => s.professional_id === pro.id);
      const revenue =
        proAppts.reduce((sum, a) => sum + Number(a.price ?? 0), 0) +
        proSales.reduce((sum, s) => sum + Number(s.total ?? 0), 0);
      const clientSet = new Set<string>();
      proAppts.forEach((a) => a.client_id && clientSet.add(a.client_id));
      proSales.forEach((s) => s.client_id && clientSet.add(s.client_id));
      const clients = clientSet.size;
      const avgTicket = clients > 0 ? revenue / clients : 0;
      return { id: pro.id, name: pro.name, revenue, clients, avgTicket };
    });
  }, [professionals, appointments, sales]);

  // Top metrics
  const totalRevenue = useMemo(() => revenueData.reduce((s, d) => s + d.value, 0), [revenueData]);

  const avgOccupancy = useMemo(() => {
    if (occupancyData.length === 0 || professionals.length === 0) return 0;
    let total = 0;
    let cells = 0;
    for (const row of occupancyData) {
      for (const pro of professionals) {
        total += (row as any)[pro.name] ?? 0;
        cells++;
      }
    }
    return cells > 0 ? Math.round(total / cells) : 0;
  }, [occupancyData, professionals]);

  const avgTicket = useMemo(() => {
    const completedCount = (appointments as any[]).filter((a) => a.status === "completed").length;
    const salesCount = (sales as any[]).length;
    const denom = completedCount + salesCount;
    return denom > 0 ? totalRevenue / denom : 0;
  }, [appointments, sales, totalRevenue]);

  const returnRate = useMemo(() => {
    const weekClients = new Set<string>();
    (appointments as any[]).forEach((a) => a.client_id && weekClients.add(a.client_id));
    if (weekClients.size === 0) return 0;
    const priorSet = new Set(priorClientIds as string[]);
    let returning = 0;
    weekClients.forEach((c) => {
      if (priorSet.has(c)) returning++;
    });
    return Math.round((returning / weekClients.size) * 100);
  }, [appointments, priorClientIds]);

  if (isLoading) {
    return (
      <AppLayout title="Relatórios" subtitle="Métricas e indicadores do seu negócio">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const proColorFor = (pro: { color?: string | null }, idx: number) =>
    pro.color || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];

  return (
    <AppLayout title="Relatórios" subtitle="Métricas e indicadores do seu negócio">
      <div className="space-y-6 animate-fade-in">
        {/* Period label */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Semana de {format(weekStart, "dd/MM")} a {format(weekEnd, "dd/MM")}
          </p>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="elevated">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Faturamento</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Ocupação</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{avgOccupancy}%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    R$ {avgTicket.toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Retorno</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{returnRate}%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Faturamento Diário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(15, 62%, 48%)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="hsl(15, 62%, 48%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, "Faturamento"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(15, 62%, 48%)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Occupancy Chart */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Ocupação por Horário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {professionals.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    Nenhum profissional cadastrado
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={occupancyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: any) => [`${value}%`, ""]}
                      />
                      {professionals.map((pro, idx) => (
                        <Bar
                          key={pro.id}
                          dataKey={pro.name}
                          fill={proColorFor(pro, idx)}
                          radius={[4, 4, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              {professionals.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
                  {professionals.map((pro, idx) => (
                    <div key={pro.id} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: proColorFor(pro, idx) }}
                      />
                      <span className="text-sm text-muted-foreground">{pro.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Professionals Performance */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Desempenho por Profissional
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proPerformance.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">
                Nenhum profissional cadastrado
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Profissional</th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">Faturamento</th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">Clientes</th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">Ticket Médio</th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">Tendência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proPerformance.map((prof, index) => (
                      <tr
                        key={prof.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors animate-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">{prof.name[0]}</span>
                            </div>
                            <span className="font-medium text-foreground">{prof.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-medium text-foreground">
                          R$ {prof.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right text-foreground">{prof.clients}</td>
                        <td className="p-3 text-right text-foreground">
                          R$ {prof.avgTicket.toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-muted-foreground">—</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}