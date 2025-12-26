import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  User,
  Scissors,
  Calendar as CalendarIcon,
  Filter
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Mock data
const professionals = [
  { id: 1, name: "Carlos", color: "bg-primary" },
  { id: 2, name: "Ana", color: "bg-success" },
  { id: 3, name: "Pedro", color: "bg-info" },
];

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
];

const appointments: Record<string, Array<{
  id: number;
  time: string;
  duration: number;
  client: string;
  service: string;
  professional: number;
  status: string;
}>> = {
  "2024-12-26": [
    { id: 1, time: "09:00", duration: 60, client: "João Silva", service: "Corte + Barba", professional: 1, status: "confirmed" },
    { id: 2, time: "10:00", duration: 45, client: "Pedro Santos", service: "Corte Degradê", professional: 1, status: "confirmed" },
    { id: 3, time: "09:30", duration: 90, client: "Maria Lima", service: "Coloração", professional: 2, status: "pending" },
    { id: 4, time: "14:00", duration: 30, client: "Lucas Oliveira", service: "Barba", professional: 1, status: "confirmed" },
    { id: 5, time: "11:00", duration: 60, client: "Fernanda Costa", service: "Corte Feminino", professional: 2, status: "confirmed" },
    { id: 6, time: "15:00", duration: 45, client: "Bruno Almeida", service: "Corte", professional: 3, status: "confirmed" },
  ],
};

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week">("day");
  const [selectedProfessional, setSelectedProfessional] = useState<number | null>(null);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const getWeekDates = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (view === "day") {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1));
    } else {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const dayAppointments = appointments["2024-12-26"] || [];
  const filteredAppointments = selectedProfessional 
    ? dayAppointments.filter(a => a.professional === selectedProfessional)
    : dayAppointments;

  return (
    <AppLayout title="Agenda" subtitle="Gerencie seus agendamentos">
      <div className="space-y-4 animate-fade-in">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm" onClick={() => navigateDate("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => navigateDate("next")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold capitalize ml-2">
              {formatDate(currentDate)}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-input overflow-hidden">
              <button
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  view === "day" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setView("day")}
              >
                Dia
              </button>
              <button
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  view === "week" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setView("week")}
              >
                Semana
              </button>
            </div>
            <Button variant="gradient">
              <Plus className="w-4 h-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>
        </div>

        {/* Professional Filter */}
        <Card variant="elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Profissional:</span>
              <div className="flex gap-2">
                <button
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium transition-all",
                    selectedProfessional === null 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                  onClick={() => setSelectedProfessional(null)}
                >
                  Todos
                </button>
                {professionals.map((prof) => (
                  <button
                    key={prof.id}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                      selectedProfessional === prof.id 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                    onClick={() => setSelectedProfessional(prof.id)}
                  >
                    <span className={cn("w-2 h-2 rounded-full", prof.color)} />
                    {prof.name}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Grid */}
        {view === "day" ? (
          <Card variant="elevated">
            <CardContent className="p-0">
              <div className="grid grid-cols-[80px_1fr] divide-x divide-border">
                {/* Time Column */}
                <div className="divide-y divide-border">
                  {timeSlots.map((time) => (
                    <div key={time} className="h-16 flex items-start justify-center pt-2">
                      <span className="text-xs text-muted-foreground font-medium">{time}</span>
                    </div>
                  ))}
                </div>

                {/* Appointments */}
                <div className="relative">
                  <div className="divide-y divide-border">
                    {timeSlots.map((time) => (
                      <div 
                        key={time} 
                        className="h-16 hover:bg-muted/50 transition-colors cursor-pointer group"
                      >
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute left-2 top-1/2 -translate-y-1/2">
                          <Plus className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Appointment Cards */}
                  {filteredAppointments.map((appointment) => {
                    const startHour = parseInt(appointment.time.split(":")[0]);
                    const startMinute = parseInt(appointment.time.split(":")[1]);
                    const topOffset = (startHour - 8) * 64 + (startMinute / 60) * 64;
                    const height = (appointment.duration / 60) * 64;
                    const prof = professionals.find(p => p.id === appointment.professional);

                    return (
                      <div
                        key={appointment.id}
                        className={cn(
                          "absolute left-2 right-2 rounded-lg p-2 cursor-pointer transition-all hover:shadow-medium animate-scale-in",
                          appointment.status === "confirmed" ? "bg-primary/10 border-l-4 border-primary" :
                          appointment.status === "pending" ? "bg-warning/10 border-l-4 border-warning" :
                          "bg-muted border-l-4 border-muted-foreground"
                        )}
                        style={{ 
                          top: `${topOffset}px`, 
                          height: `${Math.max(height - 4, 30)}px` 
                        }}
                      >
                        <div className="flex items-start justify-between h-full">
                          <div className="overflow-hidden">
                            <p className="text-sm font-medium text-foreground truncate">{appointment.client}</p>
                            <p className="text-xs text-muted-foreground truncate">{appointment.service}</p>
                          </div>
                          <Badge variant={appointment.status === "confirmed" ? "success" : "warning"} className="text-[10px] px-1.5">
                            {prof?.name}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card variant="elevated">
            <CardContent className="p-0">
              <div className="grid grid-cols-8 divide-x divide-border">
                {/* Time Column */}
                <div className="divide-y divide-border">
                  <div className="h-12 border-b border-border" />
                  {timeSlots.slice(0, 8).map((time) => (
                    <div key={time} className="h-14 flex items-start justify-center pt-2">
                      <span className="text-xs text-muted-foreground font-medium">{time}</span>
                    </div>
                  ))}
                </div>

                {/* Days */}
                {getWeekDates().map((date, index) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  return (
                    <div key={index} className="divide-y divide-border">
                      <div className={cn(
                        "h-12 flex flex-col items-center justify-center border-b border-border",
                        isToday && "bg-primary/5"
                      )}>
                        <span className="text-xs text-muted-foreground">{weekDays[date.getDay()]}</span>
                        <span className={cn(
                          "text-sm font-semibold",
                          isToday ? "text-primary" : "text-foreground"
                        )}>
                          {date.getDate()}
                        </span>
                      </div>
                      {timeSlots.slice(0, 8).map((time) => (
                        <div 
                          key={time} 
                          className={cn(
                            "h-14 hover:bg-muted/50 transition-colors cursor-pointer",
                            isToday && "bg-primary/5"
                          )}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary" />
            <span className="text-muted-foreground">Confirmado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-warning" />
            <span className="text-muted-foreground">Pendente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-destructive" />
            <span className="text-muted-foreground">Cancelado</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-info" />
            <span className="text-muted-foreground">Google Agenda</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
