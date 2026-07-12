import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useOwnerApiToken(businessId?: string) {
  return useQuery({
    queryKey: ["owner-api-token", businessId],
    queryFn: async () => {
      if (!businessId) return null;
      const { data, error } = await supabase
        .from("owner_api_tokens")
        .select("token")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data?.token ?? null;
    },
    enabled: !!businessId,
  });
}