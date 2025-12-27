import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "./useBusiness";
import { toast } from "sonner";

export interface Professional {
  id: string;
  business_id: string;
  user_id: string | null;
  name: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalFormData {
  name: string;
  color?: string;
  is_active?: boolean;
}

export function useProfessionals() {
  const { business } = useBusiness();
  const queryClient = useQueryClient();

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["professionals", business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .eq("business_id", business.id)
        .order("name");
      if (error) throw error;
      return data as Professional[];
    },
    enabled: !!business?.id,
  });

  const createProfessional = useMutation({
    mutationFn: async (formData: ProfessionalFormData) => {
      if (!business?.id) throw new Error("Negócio não encontrado");
      const { data, error } = await supabase
        .from("professionals")
        .insert({
          business_id: business.id,
          name: formData.name,
          color: formData.color || "#8B5CF6",
          is_active: formData.is_active ?? true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      toast.success("Profissional criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar profissional: " + error.message);
    },
  });

  const updateProfessional = useMutation({
    mutationFn: async ({ id, ...formData }: ProfessionalFormData & { id: string }) => {
      const { data, error } = await supabase
        .from("professionals")
        .update({
          name: formData.name,
          color: formData.color,
          is_active: formData.is_active,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      toast.success("Profissional atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar profissional: " + error.message);
    },
  });

  const deleteProfessional = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("professionals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      toast.success("Profissional removido com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao remover profissional: " + error.message);
    },
  });

  return {
    professionals,
    isLoading,
    createProfessional,
    updateProfessional,
    deleteProfessional,
  };
}
