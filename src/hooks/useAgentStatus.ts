import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useAgentStatus(businessId?: string) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["agent-status", businessId],
    queryFn: async () => {
      if (!businessId) return null;
      const { data, error } = await supabase.functions.invoke("agent-status", {
        body: { action: "get", business_id: businessId },
      });
      if (error) throw error;
      return { active: !!(data?.agent_active ?? data?.active) };
    },
    enabled: !!businessId,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: async (active: boolean) => {
      if (!businessId) throw new Error("Sem estabelecimento");
      const { error } = await supabase.functions.invoke("agent-status", {
        body: { action: "toggle", business_id: businessId, agent_active: active },
      });
      if (error) throw error;
      return active;
    },
    onSuccess: (active) => {
      qc.setQueryData(["agent-status", businessId], { active });
      toast({ title: active ? "Agente ativado" : "Agente pausado" });
    },
    onError: (e: any) =>
      toast({
        title: "Erro",
        description: e.message,
        variant: "destructive",
      }),
  });

  return {
    active: query.data?.active ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
    toggle: (v: boolean) => mutation.mutate(v),
    isSaving: mutation.isPending,
  };
}