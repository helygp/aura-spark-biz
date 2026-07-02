import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Loader2,
  Calendar as CalendarIcon,
  Sparkles,
} from "lucide-react";
import { addDays, addWeeks, format, isSameDay, startOfWeek, subDays, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useBusiness } from "@/hooks/useBusiness";
import { useProfessionals } from "@/hooks/useProfessionals";
import { useBusinessHours } from "@/hooks/useBusinessHours";
import {
  Appointment,
  AppointmentFormData,
  useAppointments,
  useAppointmentsRange,
} from "@/hooks/useAppointments";
import { AppointmentDialog } from "@/components/agenda/AppointmentDialog";
import { CreateBusinessDialog } from "@/components/onboarding/CreateBusinessDialog";
import { AppointmentCard } from "@/components/agenda/AppointmentCard";
import {
  buildDaySlots,
  DEFAULT_SLOT_MINUTES,
  getHourForDate,
  timeToMinutes,
} from "@/lib/schedule";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SLOT_HEIGHT = 56; // px per 30-min slot
const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<"day" | "week">("day");
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [defaultTime, setDefaultTime] = useState<string | undefined>(undefined);

  const { business, isLoading: businessLoading, createBusiness } = useBusiness();
  const { professionals } = useProfessionals();
  const { hours: businessHours } = useBusinessHours();

  const {
    appointments: dayAppointments,
    isLoading: dayLoading,
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
  } = useAppointments(view === "day" ? currentDate : undefined);

  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 0 }), [currentDate]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const { appointments: weekAppointments, isLoading: weekLoading } = useAppointmentsRange(
    view === "week" ? weekStart : undefined,
    view === "week" ? weekEnd : undefined,
  );

  const hourForDay = useMemo(
    () => getHourForDate(businessHours, currentDate),
    [businessHours, currentDate],
  );
  const daySlots = useMemo(() => buildDaySlots(hourForDay), [hourForDay]);

  const filteredDayApts = useMemo(() => {
    if (!selectedProfessional) return dayAppointments;
    return dayAppointments.filter((a) => a.professional_id === selectedProfessional);
  }, [dayAppointments, selectedProfessional]);

  const filteredWeekApts = useMemo(() => {
    if (!selectedProfessional) return weekAppointments;
    return weekAppointments.filter((a) => a.professional_id === selectedProfessional);
  }, [weekAppointments, selectedProfessional]);

  const navigate = (dir: "prev" | "next") => {
    if (view === "day") {
      setCurrentDate(dir === "next" ? addDays(currentDate, 1) : subDays(currentDate, 1));
    } else {
      setCurrentDate(dir === "next" ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    }
  };

  const openCreate = (time?: string) => {
    setEditing(null);
    setDefaultTime(time);
    setDialogOpen(true);
  };

  const openEdit = (apt: Appointment) => {
    setEditing(apt);
    setDefaultTime(undefined);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: AppointmentFormData) => {
    if (editing) {
      await updateAppointment.mutateAsync({ id: editing.id, ...data });
    } else {
      await createAppointment.mutateAsync(data);
    }
    setDialogOpen(false);
    setEditing(null);
  };

  // Onboarding block
  if (businessLoading) {
    return (
      <AppLayout title="Agenda" subtitle="Gerencie seus agendamentos">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!business) {
    return (
      <AppLayout title="Agenda" subtitle="Gerencie seus agendamentos">
        <CreateBusinessDialog
          open
          onSubmit={(data) => createBusiness.mutate(data)}
          isLoading={createBusiness.isPending}
        />
      </AppLayout>
    );
  }

  const dayOriginMin = hourForDay?.is_open ? timeToMinutes(hourForDay.open_time) : 0;
  const dayHeight = daySlots.length * SLOT_HEIGHT;

  return (
    <AppLayout title="Agenda" subtitle="Gerencie seus agendamentos">
      <div className="space-y-4 animate-fade-in">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm" onClick={() => navigate("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => navigate("next")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>
              Hoje
            </Button>
            <h2 className="text-lg font-semibold capitalize ml-2">
              {view === "day"
                ? format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })
                : `${format(weekStart, "d 'de' MMM", { locale: ptBR })} — ${format(weekEnd, "d 'de' MMM", { locale: ptBR })}`}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-input overflow-hidden">
              <button
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  view === "day"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setView("day")}
              >
                Dia
              </button>
              <button
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  view === "week"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setView("week")}
              >
                Semana
              </button>
            </div>
            <Button variant="gradient" onClick={() => openCreate()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>
        </div>

        {/* Professional Filter */}
        <Card variant="elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Profissional:</span>
              <div className="flex gap-2 flex-wrap">
                <button
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium transition-all",
                    selectedProfessional === null
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                  onClick={() => setSelectedProfessional(null)}
                >
                  Todos
                </button>
                {professionals
                  .filter((p) => p.is_active)
                  .map((prof) => (
                    <button
                      key={prof.id}
                      className={cn(
                        "px-3 py-1 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                        selectedProfessional === prof.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80",
                      )}
                      onClick={() => setSelectedProfessional(prof.id)}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: prof.color }}
                      />
                      {prof.name}
                    </button>
                  ))}
                {professionals.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    Nenhum profissional cadastrado ainda.
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Day View */}
        {view === "day" && (
          <Card variant="elevated">
            <CardContent className="p-0">
              {dayLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : !hourForDay?.is_open ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CalendarIcon className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-foreground font-medium">Estabelecimento fechado nesse dia</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ajuste em Configurações → Horário de Funcionamento.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-[80px_1fr]">
                  {/* Time labels */}
                  <div className="border-r border-border">
                    {daySlots.map((time) => (
                      <div
                        key={time}
                        className="flex items-start justify-center pt-1 text-xs text-muted-foreground font-medium"
                        style={{ height: SLOT_HEIGHT }}
                      >
                        {time}
                      </div>
                    ))}
                  </div>

                  {/* Slots + appointments layer */}
                  <div className="relative" style={{ height: dayHeight }}>
                    {daySlots.map((time, idx) => (
                      <div
                        key={time}
                        onClick={() => openCreate(time)}
                        className={cn(
                          "absolute left-0 right-0 border-t border-border hover:bg-muted/40 cursor-pointer transition-colors",
                          idx === 0 && "border-t-0",
                        )}
                        style={{ top: idx * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                      />
                    ))}

                    {filteredDayApts.map((apt) => {
                      const startMin = timeToMinutes(apt.start_time);
                      const endMin = timeToMinutes(apt.end_time);
                      const top =
                        ((startMin - dayOriginMin) / DEFAULT_SLOT_MINUTES) * SLOT_HEIGHT;
                      const height = Math.max(
                        ((endMin - startMin) / DEFAULT_SLOT_MINUTES) * SLOT_HEIGHT - 4,
                        32,
                      );
                      return (
                        <div
                          key={apt.id}
                          className="absolute left-2 right-2 z-10"
                          style={{ top, height }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <AppointmentCard
                            appointment={apt}
                            onEdit={() => openEdit(apt)}
                            onStatusChange={(status) =>
                              updateAppointmentStatus.mutate({ id: apt.id, status })
                            }
                            onDelete={() => deleteAppointment.mutate(apt.id)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Week View */}
        {view === "week" && (
          <Card variant="elevated">
            <CardContent className="p-0">
              {weekLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-7 divide-x divide-border">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const date = addDays(weekStart, i);
                    const isToday = isSameDay(date, new Date());
                    const dateStr = format(date, "yyyy-MM-dd");
                    const dayApts = filteredWeekApts.filter((a) => a.date === dateStr);
                    return (
                      <div key={i} className="min-h-[360px]">
                        <button
                          onClick={() => {
                            setCurrentDate(date);
                            setView("day");
                          }}
                          className={cn(
                            "w-full flex flex-col items-center justify-center py-3 border-b border-border transition-colors hover:bg-muted/40",
                            isToday && "bg-primary/5",
                          )}
                        >
                          <span className="text-xs text-muted-foreground uppercase">
                            {WEEKDAY_LABELS[date.getDay()]}
                          </span>
                          <span
                            className={cn(
                              "text-lg font-semibold",
                              isToday ? "text-primary" : "text-foreground",
                            )}
                          >
                            {format(date, "d")}
                          </span>
                        </button>
                        <div className="p-2 space-y-2">
                          {dayApts.length === 0 ? (
                            <button
                              onClick={() => {
                                setCurrentDate(date);
                                openCreate();
                              }}
                              className="w-full text-xs text-muted-foreground py-6 border border-dashed border-border rounded-md hover:bg-muted/40 transition-colors"
                            >
                              + agendar
                            </button>
                          ) : (
                            dayApts.map((apt) => (
                              <button
                                key={apt.id}
                                onClick={() => openEdit(apt)}
                                className="w-full text-left rounded-md border-l-4 bg-card px-2 py-1.5 hover:bg-muted/40 transition-colors"
                                style={{
                                  borderLeftColor: apt.professional?.color || "#8B5CF6",
                                }}
                              >
                                <div className="flex items-center gap-1.5 text-xs font-semibold">
                                  {apt.start_time.slice(0, 5)}
                                  {apt.source === "whatsapp" && (
                                    <TooltipProvider delayDuration={200}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/15 text-primary px-1 text-[9px]">
                                            <Sparkles className="h-2.5 w-2.5" />
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
                                <div className="text-xs truncate text-foreground">
                                  {apt.client?.name || "Sem cliente"}
                                </div>
                                <div className="text-[10px] truncate text-muted-foreground">
                                  {apt.service?.name || "—"}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <div className="flex items-center gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <Badge variant="info" className="text-[10px]">Agendado</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success" className="text-[10px]">Confirmado</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="warning" className="text-[10px]">Em atendimento</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-[10px]">Cancelado</Badge>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-4 h-4" />
            <span className="text-muted-foreground">Agendado pelo agente de IA</span>
          </div>
        </div>
      </div>

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        appointment={editing}
        defaultDate={currentDate}
        defaultTime={defaultTime}
        onSubmit={handleSubmit}
        isLoading={createAppointment.isPending || updateAppointment.isPending}
      />
    </AppLayout>
  );
}
