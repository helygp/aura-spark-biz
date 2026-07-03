import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "./useBusiness";
import { toast } from "sonner";
import { format } from "date-fns";

export interface TimeOff {
  id: string;
  business_id: string;
  professional_id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  created_by: string | null;
  created_at: string;
  professional?: { id: string; name: string; color: string } | null;
}

export interface TimeOffFormData {
  professional_id: string;
  date: Date;
  start_time: string;
  end_time: string;
  reason?: string | null;
}

// Casts to any because auto-generated types haven't been regenerated for this new table yet.
const table = () => (supabase as any).from("professional_time_off");

export function useTimeOff(selectedDate?: Date) {
  const { business } = useBusiness();
  const queryClient = useQueryClient();

  const { data: timeOffs = [], isLoading } = useQuery({
    queryKey: ["time_off", business?.id, selectedDate ? format(selectedDate, "yyyy-MM-dd") : null],
    queryFn: async () => {
      if (!business?.id) return [] as TimeOff[];
      let q = table()
        .select(`*, professional:professionals(id, name, color)`)
        .eq("business_id", business.id)
        .order("start_time");
      if (selectedDate) q = q.eq("date", format(selectedDate, "yyyy-MM-dd"));
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as TimeOff[];
    },
    enabled: !!business?.id,
  });

  const createTimeOff = useMutation({
    mutationFn: async (form: TimeOffFormData) => {
      if (!business?.id) throw new Error("Negócio não encontrado");
      const user = (await supabase.auth.getUser()).data.user;
      const { data, error } = await table()
        .insert({
          business_id: business.id,
          professional_id: form.professional_id,
          date: format(form.date, "yyyy-MM-dd"),
          start_time: form.start_time,
          end_time: form.end_time,
          reason: form.reason ?? null,
          created_by: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_off"] });
      toast.success("Horário bloqueado");
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao bloquear"),
  });

  const deleteTimeOff = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await table().delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_off"] });
      toast.success("Bloqueio removido");
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao remover"),
  });

  return { timeOffs, isLoading, createTimeOff, deleteTimeOff };
}