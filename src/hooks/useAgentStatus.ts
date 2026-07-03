import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const GATEWAY = "https://services.aurabr.app";

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function useAgentStatus(businessId?: string) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["agent-status", businessId],
    queryFn: async () => {
      if (!businessId) return null;
      const res = await fetch(
        `${GATEWAY}/admin/businesses/${businessId}/agent-active`,
        { headers: await authHeaders() },
      );
      if (!res.ok) throw new Error("Falha ao carregar status do agente");
      const json = await res.json();
      return { active: !!(json?.agent_active ?? json?.active) };
    },
    enabled: !!businessId,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: async (active: boolean) => {
      if (!businessId) throw new Error("Sem estabelecimento");
      const res = await fetch(
        `${GATEWAY}/admin/businesses/${businessId}/agent-active`,
        {
          method: "PATCH",
          headers: await authHeaders(),
          body: JSON.stringify({ agent_active: active }),
        },
      );
      if (!res.ok) throw new Error("Falha ao atualizar status");
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