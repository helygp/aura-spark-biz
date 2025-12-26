import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bot, 
  Calendar, 
  Users, 
  TrendingUp, 
  MessageSquare,
  Settings,
  Power,
  Sparkles,
  Zap,
  Activity,
  Clock,
  Target,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data
const agents = [
  {
    id: 1,
    name: "Agente de Agenda",
    description: "Gerencia agendamentos automaticamente via WhatsApp. Confirma, reagenda e lembra clientes.",
    icon: Calendar,
    status: "active",
    stats: { actions: 234, successRate: 96 },
    color: "primary",
  },
  {
    id: 2,
    name: "Agente de Retenção",
    description: "Identifica clientes inativos e dispara campanhas personalizadas de retorno.",
    icon: Users,
    status: "active",
    stats: { actions: 87, successRate: 78 },
    color: "success",
  },
  {
    id: 3,
    name: "Agente de Marketing",
    description: "Cria e envia promoções, ofertas de última hora e campanhas sazonais.",
    icon: MessageSquare,
    status: "active",
    stats: { actions: 156, successRate: 85 },
    color: "info",
  },
  {
    id: 4,
    name: "Agente de Performance",
    description: "Analisa métricas do negócio e sugere otimizações para aumentar faturamento.",
    icon: TrendingUp,
    status: "paused",
    stats: { actions: 42, successRate: 92 },
    color: "warning",
  },
];

const recentActions = [
  { id: 1, agent: "Agente de Agenda", action: "Confirmou agendamento de João Silva para amanhã às 10h", time: "há 5 min" },
  { id: 2, agent: "Agente de Retenção", action: "Enviou mensagem de retorno para 3 clientes inativos", time: "há 15 min" },
  { id: 3, agent: "Agente de Marketing", action: "Disparou promoção de Quinta-feira para lista de espera", time: "há 1 hora" },
  { id: 4, agent: "Agente de Agenda", action: "Reagendou cliente Maria Lima de 14h para 16h", time: "há 2 horas" },
];

export default function AgentesPage() {
  const colorMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    info: "bg-info/10 text-info",
    warning: "bg-warning/10 text-warning",
  };

  return (
    <AppLayout title="Agentes de IA" subtitle="Automação inteligente para seu negócio">
      <div className="space-y-6 animate-fade-in">
        {/* Header Banner */}
        <Card variant="gradient" className="border-primary/20 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/10" />
          <CardContent className="p-6 relative">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
                  <Bot className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    AuraAgentes
                    <Sparkles className="w-5 h-5 text-primary animate-pulse-soft" />
                  </h2>
                  <p className="text-muted-foreground">
                    Agentes de IA trabalhando 24/7 para você
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">519</p>
                  <p className="text-xs text-muted-foreground">Ações este mês</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">89%</p>
                  <p className="text-xs text-muted-foreground">Taxa de sucesso</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((agent, index) => (
            <Card 
              key={agent.id} 
              variant="elevated"
              className={cn(
                "hover:border-primary/20 transition-all group animate-slide-up",
                agent.status === "paused" && "opacity-75"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                      colorMap[agent.color]
                    )}>
                      <agent.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{agent.name}</h3>
                      <Badge 
                        variant={agent.status === "active" ? "success" : "muted"}
                        className="mt-1"
                      >
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full mr-1",
                          agent.status === "active" ? "bg-success animate-pulse" : "bg-muted-foreground"
                        )} />
                        {agent.status === "active" ? "Ativo" : "Pausado"}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon-sm">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {agent.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{agent.stats.actions}</span>
                      <span className="text-xs text-muted-foreground">ações</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-success">{agent.stats.successRate}%</span>
                    </div>
                  </div>
                  <Button 
                    variant={agent.status === "active" ? "outline" : "default"}
                    size="sm"
                  >
                    <Power className="w-4 h-4 mr-1" />
                    {agent.status === "active" ? "Pausar" : "Ativar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Actions */}
        <Card variant="elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Atividade Recente
            </CardTitle>
            <Button variant="ghost" size="sm">
              <RefreshCw className="w-4 h-4 mr-1" />
              Atualizar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActions.map((action, index) => (
                <div 
                  key={action.id}
                  className="flex items-start gap-4 p-3 rounded-lg bg-muted/50 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{action.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="muted" className="text-[10px]">{action.agent}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {action.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card variant="outlined" className="border-dashed">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Crie Agentes Personalizados
            </h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Os agentes de IA usam os dados do seu negócio para agir automaticamente. 
              Configure regras e deixe a IA trabalhar por você.
            </p>
            <Button variant="gradient">
              <Bot className="w-4 h-4 mr-2" />
              Criar Novo Agente
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
