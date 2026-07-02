import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  DollarSign,
  Clock,
  Users,
  Bot,
  ChevronRight,
  Sparkles,
  MessageSquare,
  Loader2,
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

const statusMeta: Record<
  string,
  { label: string; variant: "success" | "warning" | "muted" | "info" | "destructive" }
> = {
  scheduled: { label: "Agendado", variant: "info" },
  confirmed: { label: "Confirmado", variant: "success" },
  in_progress: { label: "Em atendimento", variant: "warning" },
  completed: { label: "Concluído", variant: "muted" },
  cancelled: { label: "Cancelado", variant: "destructive" },
  no_show: { label: "Não compareceu", variant: "muted" },
};

function useInactiveClientsCount(businessId?: string) {
  return useQuery({
    queryKey: ["dashboard", "inactive-clients", businessId],
    queryFn: async () => {
      if (!businessId) return 0;
      const cutoff = format(subDays(new Date(), 45), "yyyy-MM-dd");
      // 1) Fetch all clients for this business
      const { data: clients, error: clientsErr } = await supabase
        .from("clients")
        .select("id")
        .eq("business_id", businessId);
      if (clientsErr) throw clientsErr;
      if (!clients || clients.length === 0) return 0;
      // 2) Fetch client_ids that have appointments in the last 45 days
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

export default function DashboardPage() {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const tomorrow = useMemo(() => addDays(today, 1), [today]);

  const { business, isLoading: businessLoading, createBusiness } = useBusiness();
  const { hours: businessHours } = useBusinessHours();
  const { appointments: todayApts, isLoading: todayLoading } = useAppointments(today);
  const { appointments: tomorrowApts } = useAppointments(tomorrow);
  const { data: inactiveCount = 0 } = useInactiveClientsCount(business?.id);

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

  const hourToday = useMemo(
    () => getHourForDate(businessHours, today),
    [businessHours, today],
  );
  const hourTomorrow = useMemo(
    () => getHourForDate(businessHours, tomorrow),
    [businessHours, tomorrow],
  );

  const slotsToday = useMemo(
    () => countFreeSlots(hourToday, todayApts, today),
    [hourToday, todayApts, today],
  );
  const occupancy = useMemo(
    () => occupancyRate(hourToday, todayApts, today),
    [hourToday, todayApts, today],
  );
  const slotsTomorrow = useMemo(
    () => countFreeSlots(hourTomorrow, tomorrowApts, tomorrow),
    [hourTomorrow, tomorrowApts, tomorrow],
  );

  const insights = useMemo(() => {
    const list: { id: string; type: "opportunity" | "alert" | "suggestion"; message: string; icon: typeof Clock }[] = [];
    if (hourTomorrow?.is_open) {
      list.push({
        id: "tomorrow-slots",
        type: "opportunity",
        message: `Amanhã há ${slotsTomorrow.free} horário(s) livre(s) entre ${hourTomorrow.open_time.slice(0, 5)} e ${hourTomorrow.close_time.slice(0, 5)}.`,
        icon: Clock,
      });
    } else {
      list.push({
        id: "tomorrow-closed",
        type: "suggestion",
        message: "Amanhã o estabelecimento está fechado. Que tal reabrir para captar demanda?",
        icon: Clock,
      });
    }
    list.push({
      id: "inactive-clients",
      type: inactiveCount > 0 ? "alert" : "opportunity",
      message:
        inactiveCount > 0
          ? `${inactiveCount} cliente(s) sem retorno nos últimos 45 dias — bom momento para reengajar.`
          : "Nenhum cliente inativo há mais de 45 dias. Excelente!",
      icon: Users,
    });
    return list;
  }, [hourTomorrow, slotsTomorrow.free, inactiveCount]);

  if (businessLoading) {
    return (
      <AppLayout title="Dashboard" subtitle={currentDateLabel}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!business) {
    return (
      <AppLayout title="Dashboard" subtitle={currentDateLabel}>
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
    <AppLayout title="Dashboard" subtitle={currentDateLabel}>
      <div className="space-y-6 animate-fade-in">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="elevated" className="group hover:border-primary/20 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Atendimentos hoje</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{activeToday.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {todayApts.length - activeToday.length} cancelado(s)
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="group hover:border-success/20 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Faturamento estimado</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    R$ {revenueToday.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Soma dos agendamentos de hoje</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="group hover:border-warning/20 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Horários livres</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{slotsToday.free}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {hourToday?.is_open
                      ? `De ${slotsToday.total} disponíveis`
                      : "Fechado hoje"}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="group hover:border-info/20 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de ocupação</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{occupancy}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Do horário disponível hoje</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Appointments */}
          <div className="lg:col-span-2">
            <Card variant="elevated">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Agenda de hoje
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-primary" asChild>
                  <Link to="/agenda">
                    Ver completa
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {todayLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : todayApts.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum agendamento para hoje.</p>
                    <Button variant="outline" size="sm" className="mt-3" asChild>
                      <Link to="/agenda">Criar agendamento</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayApts.map((apt, index) => {
                      const meta = statusMeta[apt.status];
                      return (
                        <div
                          key={apt.id}
                          onClick={() => navigate("/agenda")}
                          className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer animate-slide-up"
                          style={{ animationDelay: `${index * 40}ms` }}
                        >
                          <div className="text-center min-w-[60px]">
                            <p className="text-lg font-semibold text-foreground">
                              {apt.start_time.slice(0, 5)}
                            </p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground truncate">
                                {apt.client?.name || "Sem cliente"}
                              </p>
                              {apt.source === "whatsapp" && (
                                <TooltipProvider delayDuration={200}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-[10px] font-semibold">
                                        <MessageSquare className="h-2.5 w-2.5" />
                                        IA
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Agendado pelo agente de IA no WhatsApp
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {apt.service?.name || "—"}
                              {apt.professional?.name && ` • ${apt.professional.name}`}
                            </p>
                          </div>
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          <div className="space-y-4">
            <Card variant="gradient" className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span>Insights da IA</span>
                  <Sparkles className="w-4 h-4 text-primary animate-pulse-soft" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.map((insight, index) => (
                  <div
                    key={insight.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-background/80 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        insight.type === "opportunity"
                          ? "bg-success/10 text-success"
                          : insight.type === "alert"
                          ? "bg-warning/10 text-warning"
                          : "bg-info/10 text-info"
                      }`}
                    >
                      <insight.icon className="w-4 h-4" />
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{insight.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card variant="elevated">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/agenda">
                    <Calendar className="w-4 h-4 mr-2" />
                    Novo Agendamento
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/clientes">
                    <Users className="w-4 h-4 mr-2" />
                    Cadastrar Cliente
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/marketing">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Enviar Campanha
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
