import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  Users, 
  Scissors, 
  Link2, 
  Palette,
  Bell,
  Shield,
  ChevronRight,
  Check,
  Plus,
  ExternalLink,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BusinessHoursCard } from "@/components/settings/BusinessHoursCard";

const menuItems = [
  { icon: Building2, label: "Dados do Negócio", description: "Nome, endereço, contato" },
  { icon: Clock, label: "Horário de Funcionamento", description: "Dias e horários abertos" },
  { icon: Scissors, label: "Serviços e Preços", description: "Catálogo de serviços" },
  { icon: Users, label: "Equipe", description: "Profissionais e permissões" },
  { icon: Link2, label: "Integrações", description: "Google, WhatsApp, APIs" },
  { icon: Palette, label: "Personalização", description: "Logo, cores, branding" },
  { icon: Bell, label: "Notificações", description: "Alertas e lembretes" },
  { icon: Shield, label: "Segurança", description: "Senhas e acessos" },
];

const integrations = [
  { 
    name: "Google Agenda", 
    description: "Sincronize agendamentos automaticamente",
    connected: true,
    icon: "🗓️"
  },
  { 
    name: "WhatsApp Business", 
    description: "Envie mensagens automáticas",
    connected: true,
    icon: "💬"
  },
  { 
    name: "Google Meu Negócio", 
    description: "Mantenha seu perfil atualizado",
    connected: false,
    icon: "📍"
  },
  { 
    name: "Stripe", 
    description: "Receba pagamentos online",
    connected: false,
    icon: "💳"
  },
];

const team = [
  { name: "Carlos Silva", role: "Barbeiro", status: "active" },
  { name: "Ana Santos", role: "Cabeleireira", status: "active" },
  { name: "Pedro Lima", role: "Barbeiro", status: "active" },
];

export default function ConfiguracoesPage() {
  return (
    <AppLayout title="Configurações" subtitle="Gerencie seu negócio">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
        {/* Sidebar Menu */}
        <Card variant="elevated" className="lg:col-span-1 h-fit">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {menuItems.map((item, index) => (
                <button
                  key={item.label}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                    index === 0 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    <p className="text-xs opacity-70 truncate">{item.description}</p>
                  </div>
                  {index === 0 && <ChevronRight className="w-4 h-4" />}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Business Info */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Dados do Negócio
              </CardTitle>
              <CardDescription>Informações básicas do seu estabelecimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Nome do Negócio</Label>
                  <Input id="business-name" defaultValue="Barbearia Premium" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" defaultValue="(11) 99999-0000" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input id="address" defaultValue="Rua das Flores, 123 - Centro" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="gradient">
                  <Check className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Team */}
          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Equipe
                </CardTitle>
                <CardDescription>Profissionais cadastrados</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {team.map((member, index) => (
                  <div 
                    key={member.name}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {member.name.split(" ").map(n => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">Ativo</Badge>
                      <Button variant="ghost" size="sm">Editar</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Integrations */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" />
                Integrações
              </CardTitle>
              <CardDescription>Conecte ferramentas externas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map((integration, index) => (
                  <div 
                    key={integration.name}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border transition-all animate-slide-up",
                      integration.connected 
                        ? "border-success/30 bg-success/5" 
                        : "border-border hover:border-primary/30"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{integration.icon}</span>
                      <div>
                        <p className="font-medium text-foreground">{integration.name}</p>
                        <p className="text-xs text-muted-foreground">{integration.description}</p>
                      </div>
                    </div>
                    {integration.connected ? (
                      <Badge variant="success">
                        <Check className="w-3 h-3 mr-1" />
                        Conectado
                      </Badge>
                    ) : (
                      <Button variant="outline" size="sm">
                        Conectar
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
