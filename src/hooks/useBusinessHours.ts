import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "./useBusiness";
import { toast } from "sonner";

export interface BusinessHour {
  id: string;
  business_id: string;
  weekday: number; // 0 = Sunday .. 6 = Saturday
  open_time: string;
  close_time: string;
  is_open: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessHourUpdate {
  is_open?: boolean;
  open_time?: string;
  close_time?: string;
}

export function useBusinessHours() {
  const { business } = useBusiness();
  const queryClient = useQueryClient();

  const { data: hours = [], isLoading } = useQuery({
    queryKey: ["business_hours", business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data, error } = await supabase
        .from("business_hours")
        .select("*")
        .eq("business_id", business.id)
        .order("weekday");
      if (error) throw error;
      return data as BusinessHour[];
    },
    enabled: !!business?.id,
  });

  const updateHour = useMutation({
    mutationFn: async ({ id, ...patch }: BusinessHourUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("business_hours")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_hours"] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar horário: " + error.message);
    },
  });

  return { hours, isLoading, updateHour };
}