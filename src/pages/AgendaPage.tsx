import { useMemo, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
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
  Ban,
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
import { BlockTimeDialog } from "@/components/agenda/BlockTimeDialog";
import { TimeOffBlock } from "@/components/agenda/TimeOffBlock";
import { useTimeOff, TimeOffFormData } from "@/hooks/useTimeOff";
import {
  buildDaySlots,
  DEFAULT_SLOT_MINUTES,
  getHourForDate,
  minutesToTime,
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

  const [blockOpen, setBlockOpen] = useState(false);
  const [blockDefaults, setBlockDefaults] = useState<{ start?: string; end?: string }>({});

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

  const { timeOffs, createTimeOff, deleteTimeOff } = useTimeOff(
    view === "day" ? currentDate : undefined,
  );

  const filteredDayTimeOffs = useMemo(() => {
    if (!selectedProfessional) return timeOffs;
    return timeOffs.filter((t) => t.professional_id === selectedProfessional);
  }, [timeOffs, selectedProfessional]);

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

  const openBlock = (defaults?: { start?: string; end?: string }) => {
    setBlockDefaults(defaults || {});
    setBlockOpen(true);
  };

  const handleBlockSubmit = async (data: TimeOffFormData) => {
    await createTimeOff.mutateAsync(data);
  };

  // Drag-to-select on day column
  const columnRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ y: number; slotIdx: number } | null>(null);
  const [dragRange, setDragRange] = useState<{ top: number; height: number } | null>(null);

  const yToSlotIdx = (y: number) =>
    Math.max(0, Math.min(daySlots.length - 1, Math.floor(y / SLOT_HEIGHT)));

  const onColumnMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (!columnRef.current) return;
    const rect = columnRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const slotIdx = yToSlotIdx(y);
    dragStartRef.current = { y, slotIdx };
    setDragRange({ top: slotIdx * SLOT_HEIGHT, height: SLOT_HEIGHT });
  };

  const onColumnMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragStartRef.current || !columnRef.current) return;
    const rect = columnRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const startIdx = dragStartRef.current.slotIdx;
    const currIdx = yToSlotIdx(y);
    const a = Math.min(startIdx, currIdx);
    const b = Math.max(startIdx, currIdx);
    setDragRange({ top: a * SLOT_HEIGHT, height: (b - a + 1) * SLOT_HEIGHT });
  };

  const onColumnMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragStartRef.current || !columnRef.current) {
      setDragRange(null);
      return;
    }
    const rect = columnRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const startIdx = dragStartRef.current.slotIdx;
    const currIdx = yToSlotIdx(y);
    dragStartRef.current = null;
    setDragRange(null);

    const a = Math.min(startIdx, currIdx);
    const b = Math.max(startIdx, currIdx);
    const startMin = dayOriginMin + a * DEFAULT_SLOT_MINUTES;
    const endMin = dayOriginMin + (b + 1) * DEFAULT_SLOT_MINUTES;

    if (b > a) {
      // Dragged across multiple slots → open block dialog
      openBlock({ start: minutesToTime(startMin), end: minutesToTime(endMin) });
    } else {
      // Simple click → create appointment on that slot
      openCreate(minutesToTime(startMin));
    }
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
          onSubmit={(data) =>
            createBusiness.mutate({ name: data.name, phone: data.phone, address: data.address })
          }
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
            <Button variant="outline" size="icon-sm" onClick={() => navigate("prev")} className="rounded-[10px] border-border bg-card">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => navigate("next")} className="rounded-[10px] border-border bg-card">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="rounded-[10px]">
              Hoje
            </Button>
            <h2 className="font-display text-[20px] capitalize ml-2 text-tx1">
              {view === "day"
                ? format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })
                : `${format(weekStart, "d 'de' MMM", { locale: ptBR })} — ${format(weekEnd, "d 'de' MMM", { locale: ptBR })}`}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-full bg-card border border-border p-1">
              <button
                className={cn(
                  "px-4 py-1.5 text-[13px] font-medium rounded-full transition-colors",
                  view === "day"
                    ? "bg-tx1 text-background"
                    : "text-tx3 hover:text-tx1",
                )}
                onClick={() => setView("day")}
              >
                Dia
              </button>
              <button
                className={cn(
                  "px-4 py-1.5 text-[13px] font-medium rounded-full transition-colors",
                  view === "week"
                    ? "bg-tx1 text-background"
                    : "text-tx3 hover:text-tx1",
                )}
                onClick={() => setView("week")}
              >
                Semana
              </button>
            </div>
            <Button onClick={() => openCreate()} className="rounded-[12px] bg-tx1 hover:bg-tx1/90 text-background h-10">
              <Plus className="w-4 h-4 mr-2" />
              Novo agendamento
            </Button>
            <Button
              variant="outline"
              onClick={() => openBlock()}
              className="rounded-[12px] h-10"
              title="Bloquear um intervalo (também é possível arrastando na agenda)"
            >
              <Ban className="w-4 h-4 mr-2" />
              Bloquear horário
            </Button>
          </div>
        </div>

        {/* Filters + legend */}
        <div className="rounded-[18px] bg-card border border-border p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-4 h-4 text-tx3" strokeWidth={1.8} />
            <span className="text-[12px] text-tx3">Profissional:</span>
              <div className="flex gap-2 flex-wrap">
                <button
                  className={cn(
                    "px-3 py-1 rounded-full text-[12px] font-medium transition-all",
                    selectedProfessional === null
                      ? "bg-tx1 text-background"
                      : "bg-panel2 text-tx3 hover:text-tx1",
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
                        "px-3 py-1 rounded-full text-[12px] font-medium transition-all flex items-center gap-2",
                        selectedProfessional === prof.id
                          ? "bg-tx1 text-background"
                          : "bg-panel2 text-tx3 hover:text-tx1",
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
                  <span className="text-xs text-tx4">
                    Nenhum profissional cadastrado ainda.
                  </span>
                )}
              </div>

            <div className="ml-auto flex items-center gap-4 text-[11px] text-tx3">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
                Agendado por IA
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-border" />
                Presencial / telefone
              </span>
            </div>
          </div>
        </div>

        {/* Day View */}
        {view === "day" && (
          <div className="rounded-[20px] bg-card border border-border overflow-hidden">
              {dayLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : !hourForDay?.is_open ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CalendarIcon className="w-10 h-10 text-tx4 mb-3" strokeWidth={1.5} />
                  <p className="text-tx1 font-medium">Estabelecimento fechado nesse dia</p>
                  <p className="text-sm text-tx3 mt-1">
                    Ajuste em Configurações → Horário de Funcionamento.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-[80px_1fr]">
                  {/* Time labels */}
                  <div className="border-r border-border bg-panel2/40">
                    {daySlots.map((time) => (
                      <div
                        key={time}
                        className="flex items-start justify-center pt-1 font-display text-[12.5px] text-tx4"
                        style={{ height: SLOT_HEIGHT }}
                      >
                        {time}
                      </div>
                    ))}
                  </div>

                  {/* Slots + appointments layer */}
                  <div
                    ref={columnRef}
                    className="relative select-none"
                    style={{ height: dayHeight }}
                    onMouseDown={onColumnMouseDown}
                    onMouseMove={onColumnMouseMove}
                    onMouseUp={onColumnMouseUp}
                    onMouseLeave={() => {
                      if (dragStartRef.current) {
                        dragStartRef.current = null;
                        setDragRange(null);
                      }
                    }}
                    title="Clique para agendar, arraste para bloquear um intervalo"
                  >
                    {daySlots.map((time, idx) => (
                      <div
                        key={time}
                        className={cn(
                          "absolute left-0 right-0 border-t border-line2 hover:bg-panel2 cursor-pointer transition-colors",
                          idx === 0 && "border-t-0",
                        )}
                        style={{ top: idx * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                      />
                    ))}

                    {dragRange && (
                      <div
                        className="absolute left-2 right-2 rounded-[10px] border-2 border-dashed border-primary bg-primary/10 pointer-events-none z-20"
                        style={{ top: dragRange.top, height: dragRange.height }}
                      />
                    )}

                    {filteredDayTimeOffs.map((to) => {
                      const startMin = timeToMinutes(to.start_time);
                      const endMin = timeToMinutes(to.end_time);
                      const top =
                        ((startMin - dayOriginMin) / DEFAULT_SLOT_MINUTES) * SLOT_HEIGHT;
                      const height = Math.max(
                        ((endMin - startMin) / DEFAULT_SLOT_MINUTES) * SLOT_HEIGHT - 4,
                        28,
                      );
                      return (
                        <div
                          key={to.id}
                          className="absolute left-2 right-2 z-[5]"
                          style={{ top, height }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <TimeOffBlock
                            timeOff={to}
                            onDelete={() => deleteTimeOff.mutate(to.id)}
                          />
                        </div>
                      );
                    })}

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
                          onMouseDown={(e) => e.stopPropagation()}
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
          </div>
        )}

        {/* Week View */}
        {view === "week" && (
          <div className="rounded-[20px] bg-card border border-border overflow-hidden">
              {weekLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-7 divide-x divide-line2">
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
                            "w-full flex flex-col items-center justify-center py-3 border-b border-line2 transition-colors hover:bg-panel2",
                            isToday && "bg-primary/8",
                          )}
                        >
                          <span className="text-[10px] tracking-[0.12em] text-tx4 uppercase">
                            {WEEKDAY_LABELS[date.getDay()]}
                          </span>
                          <span
                            className={cn(
                              "font-display text-[20px] mt-0.5",
                              isToday ? "text-primary" : "text-tx1",
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
                              className="w-full text-[11px] text-tx4 py-6 border border-dashed border-border rounded-[10px] hover:bg-panel2 transition-colors"
                            >
                              + agendar
                            </button>
                          ) : (
                            dayApts.map((apt) => (
                              <button
                                key={apt.id}
                                onClick={() => openEdit(apt)}
                                className={cn(
                                  "w-full text-left rounded-[10px] border-l-[3px] px-2 py-1.5 transition-colors",
                                  apt.source === "whatsapp"
                                    ? "bg-primary/10 hover:bg-primary/15"
                                    : "bg-panel2 hover:bg-line2",
                                )}
                                style={{
                                  borderLeftColor:
                                    apt.source === "whatsapp"
                                      ? "hsl(var(--primary))"
                                      : apt.professional?.color || "hsl(var(--border))",
                                }}
                              >
                                <div className="flex items-center gap-1.5 font-display text-[12px] text-tx1">
                                  {apt.start_time.slice(0, 5)}
                                  {apt.source === "whatsapp" && (
                                    <TooltipProvider delayDuration={200}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="inline-flex items-center gap-0.5 rounded-full bg-whatsapp/15 text-whatsapp px-1 text-[9px]">
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
                                <div className="text-[12px] truncate text-tx1">
                                  {apt.client?.name || "Sem cliente"}
                                </div>
                                <div className="text-[10px] truncate text-tx4">
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
          </div>
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

      <BlockTimeDialog
        open={blockOpen}
        onOpenChange={setBlockOpen}
        date={currentDate}
        defaultStart={blockDefaults.start}
        defaultEnd={blockDefaults.end}
        defaultProfessionalId={selectedProfessional || undefined}
        onSubmit={handleBlockSubmit}
        isLoading={createTimeOff.isPending}
      />
    </AppLayout>
  );
}
