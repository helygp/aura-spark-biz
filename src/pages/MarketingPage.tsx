import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Send, 
  Users, 
  Clock, 
  Zap,
  Plus,
  Calendar,
  Gift,
  Bell,
  ChevronRight,
  TrendingUp,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data
const campaigns = [
  {
    id: 1,
    name: "Lembrete de Agendamento",
    type: "automatic",
    status: "active",
    sent: 342,
    opened: 298,
    clicked: 145,
    icon: Bell,
  },
  {
    id: 2,
    name: "Promoção de Quinta",
    type: "scheduled",
    status: "active",
    sent: 156,
    opened: 134,
    clicked: 67,
    icon: Gift,
  },
  {
    id: 3,
    name: "Clientes Inativos 45+ dias",
    type: "automatic",
    status: "active",
    sent: 87,
    opened: 72,
    clicked: 28,
    icon: Users,
  },
  {
    id: 4,
    name: "Pós-Atendimento",
    type: "automatic",
    status: "paused",
    sent: 234,
    opened: 189,
    clicked: 95,
    icon: MessageSquare,
  },
];

const waitlist = [
  { id: 1, name: "Carlos Mendes", phone: "(11) 99999-1111", preferredDay: "Sábado", preferredTime: "Manhã" },
  { id: 2, name: "Amanda Silva", phone: "(11) 99999-2222", preferredDay: "Sexta", preferredTime: "Tarde" },
  { id: 3, name: "Roberto Lima", phone: "(11) 99999-3333", preferredDay: "Qualquer", preferredTime: "Noite" },
];

const templates = [
  { id: 1, name: "Confirmação de Agendamento", category: "Operacional" },
  { id: 2, name: "Lembrete 24h", category: "Operacional" },
  { id: 3, name: "Promoção Especial", category: "Marketing" },
  { id: 4, name: "Aniversário", category: "Relacionamento" },
];

export default function MarketingPage() {
  return (
    <AppLayout title="Marketing & WhatsApp" subtitle="Comunicação automatizada com clientes">
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="elevated" className="group hover:border-primary/20 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mensagens Enviadas</p>
                  <p className="text-2xl font-bold text-foreground mt-1">819</p>
                  <p className="text-xs text-muted-foreground">Este mês</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Send className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="group hover:border-success/20 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Abertura</p>
                  <p className="text-2xl font-bold text-foreground mt-1">87%</p>
                  <p className="text-xs text-success flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +5% vs mês anterior
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="group hover:border-info/20 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Campanhas Ativas</p>
                  <p className="text-2xl font-bold text-foreground mt-1">3</p>
                  <p className="text-xs text-muted-foreground">De 4 criadas</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="group hover:border-warning/20 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lista de Espera</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{waitlist.length}</p>
                  <p className="text-xs text-muted-foreground">Aguardando horário</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Banner */}
        <Card variant="gradient" className="border-info/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-info" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground font-medium">
                Os agentes de IA usam esses dados para agir automaticamente
              </p>
              <p className="text-xs text-muted-foreground">
                Campanhas, listas e templates alimentam as automações inteligentes
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaigns */}
          <div className="lg:col-span-2">
            <Card variant="elevated">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Campanhas</CardTitle>
                <Button variant="gradient" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Campanha
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {campaigns.map((campaign, index) => (
                  <div 
                    key={campaign.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      campaign.status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      <campaign.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">{campaign.name}</p>
                        <Badge variant={campaign.status === "active" ? "success" : "muted"} className="text-[10px]">
                          {campaign.status === "active" ? "Ativa" : "Pausada"}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {campaign.type === "automatic" ? "Automática" : "Agendada"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{campaign.sent} enviadas</span>
                        <span>{Math.round((campaign.opened / campaign.sent) * 100)}% abertura</span>
                        <span>{Math.round((campaign.clicked / campaign.sent) * 100)}% cliques</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Wait List */}
            <Card variant="elevated">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-warning" />
                  Lista de Espera
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {waitlist.map((person, index) => (
                  <div 
                    key={person.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{person.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {person.preferredDay} • {person.preferredTime}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon-sm">
                      <MessageSquare className="w-4 h-4 text-success" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full">
                  Ver todos ({waitlist.length})
                </Button>
              </CardContent>
            </Card>

            {/* Templates */}
            <Card variant="elevated">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {templates.map((template, index) => (
                  <div 
                    key={template.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.category}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
