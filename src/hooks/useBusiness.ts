import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Business {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useBusiness() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: business, isLoading } = useQuery({
    queryKey: ['business', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Business | null;
    },
    enabled: !!user?.id,
  });

  const createBusiness = useMutation({
    mutationFn: async (input: { name: string; phone?: string; address?: string }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('businesses')
        .insert({ ...input, owner_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', user?.id] });
      toast({ title: 'Estabelecimento criado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar estabelecimento', description: error.message, variant: 'destructive' });
    },
  });

  const updateBusiness = useMutation({
    mutationFn: async (input: { name: string; phone?: string | null; address?: string | null }) => {
      if (!business?.id) throw new Error('Estabelecimento não encontrado');
      const { data, error } = await supabase
        .from('businesses')
        .update({
          name: input.name,
          phone: input.phone ?? null,
          address: input.address ?? null,
        })
        .eq('id', business.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', user?.id] });
      toast({ title: 'Dados atualizados com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar dados', description: error.message, variant: 'destructive' });
    },
  });

  return {
    business,
    isLoading,
    createBusiness,
    updateBusiness,
  };
}
