import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, addMinutes, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { useProfessionals } from "@/hooks/useProfessionals";
import { useServices } from "@/hooks/useServices";
import { useBusiness } from "@/hooks/useBusiness";
import { Appointment, AppointmentFormData, AppointmentStatus } from "@/hooks/useAppointments";

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  defaultDate?: Date;
  defaultTime?: string;
  onSubmit: (data: AppointmentFormData) => void;
  isLoading?: boolean;
}

const statusOptions: { value: AppointmentStatus; label: string }[] = [
  { value: "scheduled", label: "Agendado" },
  { value: "confirmed", label: "Confirmado" },
  { value: "in_progress", label: "Em Atendimento" },
  { value: "completed", label: "Concluído" },
  { value: "cancelled", label: "Cancelado" },
  { value: "no_show", label: "Não Compareceu" },
];

const timeSlots = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

export function AppointmentDialog({
  open,
  onOpenChange,
  appointment,
  defaultDate,
  defaultTime,
  onSubmit,
  isLoading,
}: AppointmentDialogProps) {
  const { clients } = useClients();
  const { professionals } = useProfessionals();
  const { business } = useBusiness();
  const { services } = useServices(business?.id);

  const [formData, setFormData] = useState<{
    client_id: string;
    service_id: string;
    professional_id: string;
    date: Date;
    start_time: string;
    end_time: string;
    status: AppointmentStatus;
    notes: string;
    price: string;
  }>({
    client_id: "",
    service_id: "",
    professional_id: "",
    date: defaultDate || new Date(),
    start_time: defaultTime || "09:00",
    end_time: "09:30",
    status: "scheduled",
    notes: "",
    price: "0",
  });

  useEffect(() => {
    if (appointment) {
      setFormData({
        client_id: appointment.client_id || "",
        service_id: appointment.service_id || "",
        professional_id: appointment.professional_id || "",
        date: new Date(appointment.date + "T00:00:00"),
        start_time: appointment.start_time.slice(0, 5),
        end_time: appointment.end_time.slice(0, 5),
        status: appointment.status,
        notes: appointment.notes || "",
        price: appointment.price.toString(),
      });
    } else {
      setFormData({
        client_id: "",
        service_id: "",
        professional_id: "",
        date: defaultDate || new Date(),
        start_time: defaultTime || "09:00",
        end_time: "09:30",
        status: "scheduled",
        notes: "",
        price: "0",
      });
    }
  }, [appointment, defaultDate, defaultTime, open]);

  // Auto-calculate end time and price when service changes
  useEffect(() => {
    if (formData.service_id) {
      const service = services.find((s) => s.id === formData.service_id);
      if (service) {
        const startTime = parse(formData.start_time, "HH:mm", new Date());
        const endTime = addMinutes(startTime, service.duration_minutes);
        setFormData((prev) => ({
          ...prev,
          end_time: format(endTime, "HH:mm"),
          price: service.price.toString(),
        }));
      }
    }
  }, [formData.service_id, formData.start_time, services]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      client_id: formData.client_id || undefined,
      service_id: formData.service_id || undefined,
      professional_id: formData.professional_id || undefined,
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      status: formData.status,
      notes: formData.notes,
      price: parseFloat(formData.price) || 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {appointment ? "Editar Agendamento" : "Novo Agendamento"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? (
                    format(formData.date, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) =>
                    date && setFormData((prev) => ({ ...prev, date }))
                  }
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Horário Início</Label>
              <Select
                value={formData.start_time}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, start_time: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Horário Fim</Label>
              <Select
                value={formData.end_time}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, end_time: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, client_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Serviço</Label>
            <Select
              value={formData.service_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, service_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} ({service.duration_minutes}min - R$ {service.price.toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Profissional</Label>
            <Select
              value={formData.professional_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, professional_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um profissional" />
              </SelectTrigger>
              <SelectContent>
                {professionals.filter((p) => p.is_active).map((professional) => (
                  <SelectItem key={professional.id} value={professional.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: professional.color }}
                      />
                      {professional.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: AppointmentStatus) =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Preço (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, price: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Observações do agendamento..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {appointment ? "Salvar" : "Criar Agendamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
