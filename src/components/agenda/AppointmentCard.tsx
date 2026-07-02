import { Appointment, AppointmentStatus } from "@/hooks/useAppointments";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Clock, User, Scissors, MessageSquare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit: () => void;
  onStatusChange: (status: AppointmentStatus) => void;
  onDelete: () => void;
}

const statusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  scheduled: { label: "Agendado", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  confirmed: { label: "Confirmado", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  in_progress: { label: "Em Atendimento", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  completed: { label: "Concluído", className: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300" },
  cancelled: { label: "Cancelado", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  no_show: { label: "Não Compareceu", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
};

export function AppointmentCard({
  appointment,
  onEdit,
  onStatusChange,
  onDelete,
}: AppointmentCardProps) {
  const status = statusConfig[appointment.status];
  const professionalColor = appointment.professional?.color || "#8B5CF6";
  const isAi = appointment.source === "whatsapp";

  return (
    <div
      className="rounded-lg p-3 text-sm cursor-pointer hover:opacity-90 transition-opacity border-l-4"
      style={{
        backgroundColor: `${professionalColor}15`,
        borderLeftColor: professionalColor,
      }}
      onClick={onEdit}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="font-medium">
              {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
            </span>
            {isAi && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-[10px] font-semibold"
                    >
                      <MessageSquare className="h-2.5 w-2.5" />
                      IA
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Agendado pelo agente de IA no WhatsApp</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          {appointment.client && (
            <div className="flex items-center gap-2 mb-1">
              <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{appointment.client.name}</span>
            </div>
          )}
          
          {appointment.service && (
            <div className="flex items-center gap-2 mb-1">
              <Scissors className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{appointment.service.name}</span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <span className={cn("text-xs px-2 py-0.5 rounded-full", status.className)}>
              {status.label}
            </span>
            {appointment.professional && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: professionalColor,
                  color: "white",
                }}
              >
                {appointment.professional.name}
              </span>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange("confirmed"); }}>
              Confirmar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange("in_progress"); }}>
              Iniciar Atendimento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange("completed"); }}>
              Concluir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange("cancelled"); }}>
              Cancelar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange("no_show"); }}>
              Não Compareceu
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
