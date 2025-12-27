import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "./useBusiness";
import { toast } from "sonner";
import { format } from "date-fns";

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  business_id: string;
  client_id: string | null;
  service_id: string | null;
  professional_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes: string | null;
  price: number;
  created_at: string;
  updated_at: string;
  // Joined data
  client?: { id: string; name: string; phone: string | null } | null;
  service?: { id: string; name: string; duration_minutes: number } | null;
  professional?: { id: string; name: string; color: string } | null;
}

export interface AppointmentFormData {
  client_id?: string;
  service_id?: string;
  professional_id?: string;
  date: Date;
  start_time: string;
  end_time: string;
  status?: AppointmentStatus;
  notes?: string;
  price?: number;
}

export function useAppointments(selectedDate?: Date) {
  const { business } = useBusiness();
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", business?.id, selectedDate ? format(selectedDate, "yyyy-MM-dd") : null],
    queryFn: async () => {
      if (!business?.id) return [];
      
      let query = supabase
        .from("appointments")
        .select(`
          *,
          client:clients(id, name, phone),
          service:services(id, name, duration_minutes),
          professional:professionals(id, name, color)
        `)
        .eq("business_id", business.id)
        .order("start_time");
      
      if (selectedDate) {
        query = query.eq("date", format(selectedDate, "yyyy-MM-dd"));
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!business?.id,
  });

  const createAppointment = useMutation({
    mutationFn: async (formData: AppointmentFormData) => {
      if (!business?.id) throw new Error("Negócio não encontrado");
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          business_id: business.id,
          client_id: formData.client_id || null,
          service_id: formData.service_id || null,
          professional_id: formData.professional_id || null,
          date: format(formData.date, "yyyy-MM-dd"),
          start_time: formData.start_time,
          end_time: formData.end_time,
          status: formData.status || "scheduled",
          notes: formData.notes || null,
          price: formData.price || 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar agendamento: " + error.message);
    },
  });

  const updateAppointment = useMutation({
    mutationFn: async ({ id, ...formData }: AppointmentFormData & { id: string }) => {
      const { data, error } = await supabase
        .from("appointments")
        .update({
          client_id: formData.client_id || null,
          service_id: formData.service_id || null,
          professional_id: formData.professional_id || null,
          date: format(formData.date, "yyyy-MM-dd"),
          start_time: formData.start_time,
          end_time: formData.end_time,
          status: formData.status,
          notes: formData.notes || null,
          price: formData.price,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar agendamento: " + error.message);
    },
  });

  const updateAppointmentStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) => {
      const { data, error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Status atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento removido com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao remover agendamento: " + error.message);
    },
  });

  return {
    appointments,
    isLoading,
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
  };
}
