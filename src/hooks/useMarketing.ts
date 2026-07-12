import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "./useBusiness";
import { toast } from "sonner";

export interface Campaign {
  id: string;
  business_id: string;
  name: string;
  type: "automatic" | "scheduled";
  status: "active" | "paused";
  message_template: string | null;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  created_at: string;
  updated_at: string;
}

export interface WaitlistEntry {
  id: string;
  business_id: string;
  client_id: string | null;
  name: string;
  phone: string | null;
  preferred_day: string | null;
  preferred_time: string | null;
  created_at: string;
}

export interface MessageTemplate {
  id: string;
  business_id: string;
  name: string;
  category: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignInput {
  name: string;
  type: "automatic" | "scheduled";
  message_template?: string;
}

export interface CreateWaitlistInput {
  name: string;
  phone?: string;
  preferred_day?: string;
  preferred_time?: string;
  client_id?: string | null;
}

export interface CreateTemplateInput {
  name: string;
  category: string;
  content: string;
}

export function useMarketing() {
  const { business } = useBusiness();
  const queryClient = useQueryClient();
  const businessId = business?.id;

  const campaignsQuery = useQuery({
    queryKey: ["campaigns", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!businessId,
  });

  const waitlistQuery = useQuery({
    queryKey: ["waitlist", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from("waitlist")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WaitlistEntry[];
    },
    enabled: !!businessId,
  });

  const templatesQuery = useQuery({
    queryKey: ["message_templates", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MessageTemplate[];
    },
    enabled: !!businessId,
  });

  const createCampaign = useMutation({
    mutationFn: async (input: CreateCampaignInput) => {
      if (!businessId) throw new Error("Negócio não encontrado");
      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          business_id: businessId,
          name: input.name,
          type: input.type,
          status: "active",
          message_template: input.message_template || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campanha criada com sucesso!");
    },
    onError: (e: Error) => toast.error("Erro ao criar campanha: " + e.message),
  });

  const toggleCampaignStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "paused" }) => {
      const { error } = await supabase
        .from("campaigns")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (e: Error) => toast.error("Erro ao atualizar campanha: " + e.message),
  });

  const createWaitlistEntry = useMutation({
    mutationFn: async (input: CreateWaitlistInput) => {
      if (!businessId) throw new Error("Negócio não encontrado");
      const { data, error } = await supabase
        .from("waitlist")
        .insert({
          business_id: businessId,
          client_id: input.client_id || null,
          name: input.name,
          phone: input.phone || null,
          preferred_day: input.preferred_day || null,
          preferred_time: input.preferred_time || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitlist"] });
      toast.success("Adicionado à lista de espera!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });

  const createTemplate = useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      if (!businessId) throw new Error("Negócio não encontrado");
      const { data, error } = await supabase
        .from("message_templates")
        .insert({
          business_id: businessId,
          name: input.name,
          category: input.category,
          content: input.content,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message_templates"] });
      toast.success("Template criado com sucesso!");
    },
    onError: (e: Error) => toast.error("Erro ao criar template: " + e.message),
  });

  return {
    campaigns: campaignsQuery.data ?? [],
    waitlist: waitlistQuery.data ?? [],
    templates: templatesQuery.data ?? [],
    isLoading:
      campaignsQuery.isLoading || waitlistQuery.isLoading || templatesQuery.isLoading,
    createCampaign,
    toggleCampaignStatus,
    createWaitlistEntry,
    createTemplate,
  };
}