import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar, MessageCircle, Megaphone, BarChart3, Lock, Loader2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/hooks/useBusiness";
import { useAgentStatus } from "@/hooks/useAgentStatus";

export default function AgentesPage() {
  const { business, isLoading: bizLoading } = useBusiness();
  const { active, isLoading: statusLoading, toggle, isSaving } = useAgentStatus(business?.id);

  const { data: aiAppts = [], isLoading: apptsLoading } = useQuery({
    queryKey: ["ai-appointments", business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("id, date, start_time, status, price, source, client:clients(name)")
        .eq("business_id", business.id)
        .eq("source", "whatsapp")
        .order("date", { ascending: false })
        .order("start_time", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!business?.id,
  });

  const revenue = useMemo(
    () =>
      aiAppts
        .filter((a: any) => a.status === "completed")
        .reduce((s, a: any) => s + Number(a.price ?? 0), 0),
    [aiAppts],
  );
  const totalAi = aiAppts.length;
  const lastAi: any = aiAppts[0];

  const loading = bizLoading || apptsLoading;

  return (
    <AppLayout title="Agentes" subtitle="Sua equipe de IA">
      <div className="space-y-6 animate-fade-in">
        {/* Hero */}
        <div className="rounded-[24px] hero-glow p-8 md:p-10 text-hero-foreground relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 relative">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-hero-foreground/10 backdrop-blur px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-hero-foreground/80">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-70" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                Agentes trabalhando
              </span>

              <h1 className="font-display text-[38px] md:text-[52px] leading-[1.05] mt-5 text-hero-foreground">
                Sua IA gerou{" "}
                <span className="text-primary">
                  R$ {revenue.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                </span>{" "}
                em receita
              </h1>
              <p className="text-[14px] text-hero-foreground/70 mt-4 max-w-lg leading-relaxed">
                Soma dos agendamentos concluídos que o agente de IA fechou pelo WhatsApp — sem
                secretária, sem esforço manual.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6 lg:gap-8 shrink-0">
              <div>
                <div className="font-display text-[32px] leading-none text-hero-foreground">
                  {totalAi}
                </div>
                <div className="text-[11px] uppercase tracking-[0.12em] text-hero-foreground/60 mt-2">
                  Agendamentos<br />via IA
                </div>
              </div>
              <div>
                <div className="font-display text-[32px] leading-none text-hero-foreground/60">
                  —
                </div>
                <div className="text-[11px] uppercase tracking-[0.12em] text-hero-foreground/60 mt-2">
                  Mensagens<br />trocadas
                </div>
              </div>
              <div>
                <div className="font-display text-[32px] leading-none text-hero-foreground/60">
                  —
                </div>
                <div className="text-[11px] uppercase tracking-[0.12em] text-hero-foreground/60 mt-2">
                  Tempo médio<br />resposta
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Agents grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Agente de Agenda — real */}
          <div className="rounded-[22px] bg-card border border-border p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[14px] bg-primary/12 flex items-center justify-center text-[22px]">
                  📅
                </div>
                <div>
                  <h3 className="font-display text-[20px] text-tx1 leading-none">
                    Agente de Agenda
                  </h3>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success/12 text-success px-2 py-0.5 text-[11px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    {active ? "Ativo" : "Pausado"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(statusLoading || isSaving) && (
                  <Loader2 className="w-4 h-4 animate-spin text-tx3" />
                )}
                <Switch
                  checked={active}
                  disabled={statusLoading || isSaving || !business?.id}
                  onCheckedChange={toggle}
                />
              </div>
            </div>

            <p className="text-[13px] text-tx3 leading-relaxed mt-5">
              Recebe mensagens no WhatsApp, entende o que o cliente quer, oferece horários e confirma
              o agendamento — 24 horas por dia.
            </p>

            {/* Activity feed */}
            <div className="mt-5 rounded-[14px] bg-panel2 border border-line2 p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] text-tx4 mb-2">
                Última ação
              </div>
              {loading ? (
                <div className="text-[13px] text-tx3">Carregando…</div>
              ) : lastAi ? (
                <div className="text-[13px] text-tx1 leading-snug">
                  Confirmou o agendamento de{" "}
                  <span className="font-medium">{lastAi.client?.name ?? "cliente"}</span> para{" "}
                  {format(new Date(lastAi.date + "T" + lastAi.start_time), "dd/MM 'às' HH:mm", {
                    locale: ptBR,
                  })}
                  <div className="text-[11px] text-tx4 mt-1">
                    {formatDistanceToNow(
                      new Date(lastAi.date + "T" + lastAi.start_time),
                      { addSuffix: true, locale: ptBR },
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-[13px] text-tx3">Nenhuma ação registrada ainda.</div>
              )}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              <Metric label="Agendamentos" value={totalAi.toString()} />
              <Metric
                label="Receita"
                value={`R$ ${revenue.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`}
              />
              <Metric label="Resposta" value="—" muted />
            </div>
          </div>

          <LockedAgent
            emoji="💬"
            name="Agente de Retenção"
            teaser="Identifica clientes que sumiram e envia uma mensagem carinhosa no tom da sua marca para trazê-los de volta."
            bullets={[
              "Detecta inatividade automática (30/45/60 dias)",
              "Mensagens personalizadas por segmento",
              "Cupom inteligente conforme o histórico",
            ]}
          />
          <LockedAgent
            emoji="📣"
            name="Agente de Marketing"
            teaser="Cria e dispara campanhas de última hora para preencher horários vagos e datas fracas na agenda."
            bullets={[
              "Sugere promoções com base na ocupação",
              "Envia para lista segmentada no WhatsApp",
              "Mede conversão em tempo real",
            ]}
          />
          <LockedAgent
            emoji="📊"
            name="Agente de Performance"
            teaser="Analisa o negócio todo dia e te avisa em linguagem simples o que ajustar para faturar mais."
            bullets={[
              "Diagnóstico diário automatizado",
              "Alertas quando algo destoa do padrão",
              "Recomendações práticas de ajuste",
            ]}
          />
        </div>
      </div>
    </AppLayout>
  );
}

function Metric({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-[12px] bg-panel2 border border-line2 p-3">
      <div
        className={
          "font-display text-[20px] leading-none " + (muted ? "text-tx3" : "text-tx1")
        }
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-[0.12em] text-tx4 mt-2">{label}</div>
    </div>
  );
}

function LockedAgent({
  emoji,
  name,
  teaser,
  bullets,
}: {
  emoji: string;
  name: string;
  teaser: string;
  bullets: string[];
}) {
  return (
    <div className="rounded-[22px] bg-panel2 border border-line2 p-6 relative">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[14px] bg-card border border-border flex items-center justify-center text-[22px] opacity-70">
            {emoji}
          </div>
          <div>
            <h3 className="font-display text-[20px] text-tx2 leading-none">{name}</h3>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-card border border-border text-tx3 px-2 py-0.5 text-[11px] font-medium">
              <Lock className="w-3 h-3" />
              Em breve
            </div>
          </div>
        </div>
      </div>

      <p className="text-[13px] text-tx3 leading-relaxed mt-5">{teaser}</p>

      <ul className="mt-4 space-y-2">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-[13px] text-tx3">
            <span className="mt-1.5 w-1 h-1 rounded-full bg-tx4 shrink-0" />
            {b}
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block w-full">
                <Button
                  disabled
                  className="w-full rounded-[12px] bg-tx1/90 text-background h-10 font-medium opacity-60 cursor-not-allowed"
                >
                  Desbloquear no plano Pro
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Em breve — integração de planos ainda não disponível</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
