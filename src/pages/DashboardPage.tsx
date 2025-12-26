import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  Users, 
  TrendingUp, 
  Bot, 
  AlertCircle,
  ChevronRight,
  Sparkles,
  MessageSquare
} from "lucide-react";

// Mock data
const todayAppointments = [
  { id: 1, time: "09:00", client: "João Silva", service: "Corte + Barba", professional: "Carlos", status: "confirmed" },
  { id: 2, time: "10:00", client: "Pedro Santos", service: "Corte Degradê", professional: "Carlos", status: "confirmed" },
  { id: 3, time: "11:30", client: "Maria Lima", service: "Coloração", professional: "Ana", status: "pending" },
  { id: 4, time: "14:00", client: "Lucas Oliveira", service: "Barba", professional: "Carlos", status: "confirmed" },
  { id: 5, time: "15:30", client: "Fernanda Costa", service: "Corte Feminino", professional: "Ana", status: "confirmed" },
];

const aiInsights = [
  { id: 1, type: "opportunity", message: "Você tem 2 horários vagos amanhã às 14h e 16h", icon: Clock },
  { id: 2, type: "alert", message: "12 clientes não retornam há mais de 45 dias", icon: Users },
  { id: 3, type: "suggestion", message: "Quinta-feira tem baixa ocupação. Sugerimos promoção via WhatsApp", icon: MessageSquare },
];

const statusColors: Record<string, "success" | "warning" | "muted"> = {
  confirmed: "success",
  pending: "warning",
  cancelled: "muted",
};

const statusLabels: Record<string, string> = {
  confirmed: "Confirmado",
  pending: "Pendente",
  cancelled: "Cancelado",
};

export default function DashboardPage() {
  const currentDate = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <AppLayout 
      title="Dashboard" 
      subtitle={currentDate.charAt(0).toUpperCase() + currentDate.slice(1)}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="elevated" className="group hover:border-primary/20 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Atendimentos Hoje</p>
                  <p className="text-3xl font-bold text-foreground mt-1">12</p>
                  <p className="text-xs text-success flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +18% vs ontem
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="group hover:border-success/20 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Faturamento Estimado</p>
                  <p className="text-3xl font-bold text-foreground mt-1">R$ 1.450</p>
                  <p className="text-xs text-success flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +12% vs ontem
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="group hover:border-warning/20 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Horários Livres</p>
                  <p className="text-3xl font-bold text-foreground mt-1">4</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    De 18 disponíveis
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center group-hover:bg-warning/20 transition-colors">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="group hover:border-info/20 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Ocupação</p>
                  <p className="text-3xl font-bold text-foreground mt-1">78%</p>
                  <p className="text-xs text-success flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +5% esta semana
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center group-hover:bg-info/20 transition-colors">
                  <Users className="w-6 h-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Appointments */}
          <div className="lg:col-span-2">
            <Card variant="elevated">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Agenda de Hoje
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-primary">
                  Ver completa
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todayAppointments.map((appointment, index) => (
                    <div 
                      key={appointment.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="text-center min-w-[60px]">
                        <p className="text-lg font-semibold text-foreground">{appointment.time}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{appointment.client}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {appointment.service} • {appointment.professional}
                        </p>
                      </div>
                      <Badge variant={statusColors[appointment.status]}>
                        {statusLabels[appointment.status]}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          <div className="space-y-4">
            <Card variant="gradient" className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span>Insights da IA</span>
                  <Sparkles className="w-4 h-4 text-primary animate-pulse-soft" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {aiInsights.map((insight, index) => (
                  <div 
                    key={insight.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-background/80 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      insight.type === "opportunity" ? "bg-success/10 text-success" :
                      insight.type === "alert" ? "bg-warning/10 text-warning" :
                      "bg-info/10 text-info"
                    }`}>
                      <insight.icon className="w-4 h-4" />
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{insight.message}</p>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full text-primary">
                  Ver todas as recomendações
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card variant="elevated">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Novo Agendamento
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Cadastrar Cliente
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Enviar Campanha
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
