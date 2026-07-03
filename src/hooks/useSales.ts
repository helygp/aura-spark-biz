import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "./useBusiness";
import { toast } from "sonner";

export interface SaleItemInput {
  item_type: "service" | "product";
  item_id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CreateSaleInput {
  client_id?: string | null;
  professional_id: string;
  items: SaleItemInput[];
  payment_method: "card" | "cash" | "pix";
}

const COMMISSION_PCT = 40;

export function useSales() {
  const { business } = useBusiness();
  const queryClient = useQueryClient();

  const createSale = useMutation({
    mutationFn: async (input: CreateSaleInput) => {
      if (!business?.id) throw new Error("Negócio não encontrado");
      if (!input.items.length) throw new Error("Comanda sem itens");

      const subtotal = input.items.reduce(
        (sum, i) => sum + Number(i.price) * i.quantity,
        0
      );
      const commission_amount = subtotal * (COMMISSION_PCT / 100);
      const total = subtotal;

      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          business_id: business.id,
          client_id: input.client_id || null,
          professional_id: input.professional_id,
          subtotal,
          commission_pct: COMMISSION_PCT,
          commission_amount,
          total,
          payment_method: input.payment_method,
        })
        .select()
        .single();
      if (saleError) throw saleError;

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(
          input.items.map((i) => ({
            sale_id: sale.id,
            item_type: i.item_type,
            item_id: i.item_id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          }))
        );
      if (itemsError) throw itemsError;

      // Decrement product stock for each product item
      const productItems = input.items.filter((i) => i.item_type === "product");
      for (const p of productItems) {
        const { data: current } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", p.item_id)
          .maybeSingle();
        const currentStock = Number(current?.stock_quantity ?? 0);
        const newStock = Math.max(0, currentStock - p.quantity);
        await supabase
          .from("products")
          .update({ stock_quantity: newStock })
          .eq("id", p.item_id);
      }

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Comanda finalizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao finalizar comanda: " + error.message);
    },
  });

  return { createSale, commissionPct: COMMISSION_PCT };
}