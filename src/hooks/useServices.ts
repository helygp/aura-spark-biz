import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceInput {
  business_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  is_active?: boolean;
}

export function useServices(businessId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessId)
        .order('name');
      
      if (error) throw error;
      return data as Service[];
    },
    enabled: !!businessId,
  });

  const createService = useMutation({
    mutationFn: async (input: ServiceInput) => {
      const { data, error } = await supabase
        .from('services')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', businessId] });
      toast({ title: 'Serviço criado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar serviço', description: error.message, variant: 'destructive' });
    },
  });

  const updateService = useMutation({
    mutationFn: async ({ id, ...input }: Partial<ServiceInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('services')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', businessId] });
      toast({ title: 'Serviço atualizado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar serviço', description: error.message, variant: 'destructive' });
    },
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', businessId] });
      toast({ title: 'Serviço removido!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover serviço', description: error.message, variant: 'destructive' });
    },
  });

  return {
    services,
    isLoading,
    createService,
    updateService,
    deleteService,
  };
}
