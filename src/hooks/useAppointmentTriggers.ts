import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "./useBusiness";
import { useChatPanel } from "@/contexts/ChatPanelContext";

/**
 * Listens to appointment cancellations via Supabase Realtime and
 * pushes a proactive system message into the chat panel.
 */
export function useAppointmentTriggers() {
  const { business } = useBusiness();
  const { pushSystemMessage } = useChatPanel();
  const recentRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!business?.id) return;

    const channel = supabase
      .channel(`appointments-triggers-${business.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "appointments",
          filter: `business_id=eq.${business.id}`,
        },
        async (payload) => {
          const oldRow = payload.old as { status?: string } | null;
          const newRow = payload.new as {
            id: string;
            status?: string;
            client_id?: string | null;
            start_time?: string | null;
            date?: string | null;
          } | null;
          if (!newRow) return;
          if (newRow.status !== "cancelled") return;
          if (oldRow?.status === "cancelled") return;

          // Debounce: skip if same appointment fired in last 5s
          const now = Date.now();
          const last = recentRef.current.get(newRow.id);
          if (last && now - last < 5000) return;
          recentRef.current.set(newRow.id, now);

          let clientName = "cliente";
          if (newRow.client_id) {
            const { data } = await supabase
              .from("clients")
              .select("name")
              .eq("id", newRow.client_id)
              .maybeSingle();
            if (data?.name) clientName = data.name;
          }
          const time = (newRow.start_time || "").slice(0, 5) || "—";
          pushSystemMessage(
            `O agendamento de ${clientName} às ${time} foi cancelado. Quer que eu avise a lista de espera ou ofereça o horário pra outro cliente?`,
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [business?.id, pushSystemMessage]);
}