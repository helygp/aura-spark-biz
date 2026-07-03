import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Users,
  ChevronRight,
  Sparkles,
  MessageSquare,
  Loader2,
  ArrowUpRight,
  Plus,
  TrendingUp,
} from "lucide-react";
import { addDays, format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAppointments } from "@/hooks/useAppointments";
import { useBusiness } from "@/hooks/useBusiness";
import { useBusinessHours } from "@/hooks/useBusinessHours";
import { CreateBusinessDialog } from "@/components/onboarding/CreateBusinessDialog";
import {
  countFreeSlots,
  getHourForDate,
  occupancyRate,
} from "@/lib/schedule";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function useInactiveClientsCount(businessId?: string) {
  return useQuery({
    queryKey: ["dashboard", "inactive-clients", businessId],
    queryFn: async () => {
      if (!businessId) return 0;
      const cutoff = format(subDays(new Date(), 45), "yyyy-MM-dd");
      const { data: clients, error: clientsErr } = await supabase
        .from("clients")
        .select("id")
        .eq("business_id", businessId);
      if (clientsErr) throw clientsErr;
      if (!clients || clients.length === 0) return 0;
      const { data: recentApts, error: aptsErr } = await supabase
        .from("appointments")
        .select("client_id")
        .eq("business_id", businessId)
        .gte("date", cutoff)
        .not("client_id", "is", null);
      if (aptsErr) throw aptsErr;
      const recentIds = new Set((recentApts || []).map((a) => a.client_id));
      return clients.filter((c) => !recentIds.has(c.id)).length;
    },
    enabled: !!businessId,
  });
}

function useNewClientsWeek(businessId?: string) {
  return useQuery({
    queryKey: ["dashboard", "new-clients-week", businessId],
    queryFn: async () => {
      if (!businessId) return 0;
      const from = subDays(new Date(), 7).toISOString();
      const { count } = await supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .gte("created_at", from);
      return count ?? 0;
    },
    enabled: !!businessId,
  });
}

function Ring({ value }: { value: number }) {
  const size = 128;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="hsl(var(--line2))"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="hsl(var(--primary))"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        fill="none"
        className="transition-all duration-700"
      />
    </svg>
  );
}

function Spark() {
  // Discreet SVG sparkline
  const points = [8, 12, 10, 15, 13, 20, 18, 24, 22, 28, 26, 32];
  const max = Math.max(...points);
  const w = 140, h = 40;
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - (p / max) * h;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="opacity-90">
      <path d={path} stroke="hsl(var(--primary))" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const tomorrow = useMemo(() => addDays(today, 1), [today]);

  const { business, isLoading: businessLoading, createBusiness } = useBusiness();
  const { hours: businessHours } = useBusinessHours();
  const { appointments: todayApts, isLoading: todayLoading } = useAppointments(today);
  const { appointments: tomorrowApts } = useAppointments(tomorrow);
  const { data: inactiveCount = 0 } = useInactiveClientsCount(business?.id);
  const { data: newClientsWeek = 0 } = useNewClientsWeek(business?.id);

  const currentDateLabel = useMemo(() => {
    const s = format(today, "EEEE, d 'de' MMMM", { locale: ptBR });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }, [today]);

  const activeToday = useMemo(
    () => todayApts.filter((a) => a.status !== "cancelled" && a.status !== "no_show"),
    [todayApts],
  );
  const revenueToday = useMemo(
    () => activeToday.reduce((sum, a) => sum + Number(a.price || 0), 0),
    [activeToday],
  );
  const avgTicket = activeToday.length > 0 ? revenueToday / activeToday.length : 0;

  const hourToday = useMemo(() => getHourForDate(businessHours, today), [businessHours, today]);
  const hourTomorrow = useMemo(() => getHourForDate(businessHours, tomorrow), [businessHours, tomorrow]);
  const slotsToday = useMemo(() => countFreeSlots(hourToday, todayApts, today), [hourToday, todayApts, today]);
  const occupancy = useMemo(() => occupancyRate(hourToday, todayApts, today), [hourToday, todayApts, today]);
  const slotsTomorrow = useMemo(
    () => countFreeSlots(hourTomorrow, tomorrowApts, tomorrow),
    [hourTomorrow, tomorrowApts, tomorrow],
  );

  const monthlyGoal = 30000;
  const goalProgress = Math.min(100, Math.round((revenueToday / monthlyGoal) * 100 * 30));

  const insight = useMemo(() => {
    if (hourTomorrow?.is_open && slotsTomorrow.free > 0) {
      return `Amanhã você tem ${slotsTomorrow.free} horários livres. Que tal disparar uma campanha de reengajamento para os ${inactiveCount} clientes inativos?`;
    }
    if (inactiveCount > 0) {
      return `${inactiveCount} clientes não retornam há mais de 45 dias — um bom momento para acionar o agente de IA.`;
    }
    return "Sua base de clientes está em dia. Aproveite para revisar preços e serviços.";
  }, [hourTomorrow, slotsTomorrow.free, inactiveCount]);

  if (businessLoading) {
    return (
      <AppLayout title="Painel" subtitle={currentDateLabel}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!business) {
    return (
      <AppLayout title="Painel" subtitle={currentDateLabel}>
        <CreateBusinessDialog
          open
          onSubmit={(data) =>
            createBusiness.mutate({ name: data.name, phone: data.phone, address: data.address })
          }
          isLoading={createBusiness.isPending}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Painel" subtitle={currentDateLabel}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in">
        {/* Hero — revenue */}
        <div className="lg:col-span-2 rounded-[22px] bg-hero p-8 relative overflow-hidden">
          <div className="absolute -bottom-6 -right-4 opacity-70">
            <Spark />
          </div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-hero-foreground/60">
                Faturamento de hoje
              </p>
              <div className="flex items-baseline gap-3 mt-3">
                <span className="font-display text-[58px] leading-none text-hero-foreground">
                  R$ {revenueToday.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-success/15 text-success px-2 py-0.5 text-[11px] font-medium">
                  <TrendingUp className="w-3 h-3" />
                  {activeToday.length} atend.
                </span>
              </div>
              <p className="text-[13px] text-hero-foreground/60 mt-3">
                Soma dos agendamentos ativos de hoje
              </p>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between text-[11px] text-hero-foreground/60 mb-2">
              <span>Meta mensal projetada</span>
              <span className="text-hero-foreground/80">{goalProgress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-hero-foreground/10 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Ring occupancy */}
        <div className="rounded-[22px] bg-card border border-border p-6 flex flex-col items-center justify-center">
          <p className="text-[11px] uppercase tracking-[0.14em] text-tx4 self-start">
            Ocupação de hoje
          </p>
          <div className="relative mt-3">
            <Ring value={occupancy} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-[28px] text-tx1 leading-none">{occupancy}%</span>
              <span className="text-[10px] text-tx4 mt-1">
                {slotsToday.free} livres
              </span>
            </div>
          </div>
          {!hourToday?.is_open && (
            <p className="text-[11px] text-tx4 mt-3">Estabelecimento fechado hoje</p>
          )}
        </div>

        {/* KPI trio */}
        <KpiCard
          label="Agendamentos"
          value={activeToday.length.toString()}
          delta={`${todayApts.length - activeToday.length} cancel.`}
          positive={activeToday.length > 0}
        />
        <KpiCard
          label="Ticket médio"
          value={`R$ ${avgTicket.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`}
          delta="hoje"
          positive
        />
        <KpiCard
          label="Novos clientes"
          value={newClientsWeek.toString()}
          delta="últimos 7 dias"
          positive={newClientsWeek > 0}
        />

        {/* Agenda de hoje */}
        <div className="lg:col-span-2 rounded-[22px] bg-card border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-[20px] text-tx1">Agenda de Hoje</h2>
              <p className="text-[12px] text-tx4 mt-0.5">Próximos atendimentos</p>
            </div>
            <Button variant="ghost" size="sm" className="text-tx2 hover:text-tx1" asChild>
              <Link to="/agenda">
                Ver agenda <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>

          {todayLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : todayApts.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border rounded-[16px]">
              <Calendar className="w-8 h-8 text-tx4 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm text-tx3">Nenhum agendamento para hoje</p>
              <Button variant="outline" size="sm" className="mt-3 rounded-[10px]" asChild>
                <Link to="/agenda">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Criar
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {todayApts.slice(0, 6).map((apt) => {
                const isAi = apt.source === "whatsapp";
                return (
                  <button
                    key={apt.id}
                    onClick={() => navigate("/agenda")}
                    className="w-full flex items-center gap-4 p-3 rounded-[14px] hover:bg-panel2 transition-colors text-left"
                  >
                    <div className="font-display text-[18px] text-tx1 min-w-[60px]">
                      {apt.start_time.slice(0, 5)}
                    </div>
                    <div
                      className="w-[3px] h-10 rounded-full flex-shrink-0"
                      style={{ backgroundColor: isAi ? "hsl(var(--primary))" : "hsl(var(--border))" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-medium text-tx1 truncate">
                          {apt.client?.name || "Sem cliente"}
                        </p>
                        {isAi && (
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-1 rounded-full bg-whatsapp/15 text-whatsapp px-1.5 py-0.5 text-[10px] font-semibold">
                                  <MessageSquare className="w-2.5 h-2.5" />
                                  IA
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>Agendado pelo agente de IA no WhatsApp</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <p className="text-[12px] text-tx3 truncate mt-0.5">
                        {apt.service?.name || "—"}
                        {apt.professional?.name && ` • ${apt.professional.name}`}
                      </p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-tx4" strokeWidth={1.8} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="rounded-[22px] hero-glow p-6 text-hero-foreground relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-[10px] bg-primary/25 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="font-medium text-[14px]">Insight da IA</span>
            <span className="ml-auto flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-hero-foreground/70">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-70" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              Ao vivo
            </span>
          </div>

          <p className="text-[14px] leading-relaxed text-hero-foreground/90 mb-6">
            {insight}
          </p>

          <div className="flex flex-col gap-2">
            <Button
              className="rounded-[12px] bg-primary hover:bg-primary-hover text-primary-foreground h-10 font-medium"
              asChild
            >
              <Link to="/marketing">
                <MessageSquare className="w-4 h-4 mr-2" />
                Enviar campanha
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="rounded-[12px] text-hero-foreground/80 hover:bg-hero-foreground/10 hover:text-hero-foreground h-10"
              asChild
            >
              <Link to="/agentes">
                <Sparkles className="w-4 h-4 mr-2" />
                Ajustar agente
              </Link>
            </Button>
          </div>

          <div className="mt-6 pt-5 border-t border-hero-foreground/10 grid grid-cols-2 gap-3 text-[11px] text-hero-foreground/60">
            <div>
              <div className="font-display text-[18px] text-hero-foreground">
                {inactiveCount}
              </div>
              inativos 45d+
            </div>
            <div>
              <Clock className="w-3 h-3 inline mr-1" />
              <span className="font-display text-[18px] text-hero-foreground">
                {slotsToday.free}
              </span>
              <div>slots livres hoje</div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function KpiCard({
  label,
  value,
  delta,
  positive,
}: {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
}) {
  return (
    <div className="rounded-[22px] bg-card border border-border p-6">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.14em] text-tx4">{label}</p>
        <span
          className={
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium " +
            (positive
              ? "bg-success/12 text-success"
              : "bg-destructive/12 text-destructive")
          }
        >
          {delta}
        </span>
      </div>
      <div className="font-display text-[38px] text-tx1 mt-4 leading-none">{value}</div>
    </div>
  );
}