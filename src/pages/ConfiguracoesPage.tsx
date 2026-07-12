import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Clock,
  Edit,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BusinessHoursCard } from "@/components/settings/BusinessHoursCard";
import { useBusiness } from "@/hooks/useBusiness";
import { useProfessionals, Professional } from "@/hooks/useProfessionals";
import { ProfessionalDialog, ProfessionalFormValues } from "@/components/settings/ProfessionalDialog";
import { useOwnerApiToken } from "@/hooks/useOwnerApiToken";
import { Sparkles, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  { name: "Google Agenda", description: "Sincronize agendamentos automaticamente", icon: "🗓️" },
  { name: "WhatsApp Business", description: "Envie mensagens automáticas", icon: "💬" },
  { name: "Google Meu Negócio", description: "Mantenha seu perfil atualizado", icon: "📍" },
  { name: "Stripe", description: "Receba pagamentos online", icon: "💳" },
];

export default function ConfiguracoesPage() {
  const navigate = useNavigate();
  const { business, isLoading: businessLoading, updateBusiness } = useBusiness();
  const {
    professionals,
    isLoading: proLoading,
    createProfessional,
    updateProfessional,
  } = useProfessionals();
  const { data: apiToken, isLoading: tokenLoading } = useOwnerApiToken(business?.id);
  const { toast } = useToast();

  const [activeSection, setActiveSection] = useState<string>("Dados do Negócio");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPro, setEditingPro] = useState<Professional | null>(null);

  useEffect(() => {
    if (business) {
      setName(business.name ?? "");
      setPhone(business.phone ?? "");
      setAddress(business.address ?? "");
    }
  }, [business]);

  const handleSaveBusiness = () => {
    if (!name.trim()) return;
    updateBusiness.mutate({ name, phone: phone || null, address: address || null });
  };

  const openCreatePro = () => {
    setEditingPro(null);
    setDialogOpen(true);
  };

  const openEditPro = (pro: Professional) => {
    setEditingPro(pro);
    setDialogOpen(true);
  };

  const handleProSubmit = (data: ProfessionalFormValues) => {
    const payload = {
      name: data.name ?? "",
      role: data.role ?? null,
      color: data.color ?? "#8B5CF6",
      is_active: data.is_active ?? true,
    };
    if (editingPro) {
      updateProfessional.mutate(
        { id: editingPro.id, ...payload },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditingPro(null);
          },
        }
      );
    } else {
      createProfessional.mutate(payload, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  const toggleActive = (pro: Professional) => {
    updateProfessional.mutate({
      id: pro.id,
      name: pro.name,
      color: pro.color,
      role: pro.role,
      is_active: !pro.is_active,
    });
  };

  const comingSoonSections = ["Personalização", "Notificações", "Segurança"];
  const activeItem = menuItems.find((i) => i.label === activeSection) ?? menuItems[0];

  return (
    <AppLayout title="Configurações" subtitle="Gerencie seu negócio">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
        {/* Sidebar Menu */}
        <Card variant="elevated" className="lg:col-span-1 h-fit">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => setActiveSection(item.label)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                    activeSection === item.label
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    <p className="text-xs opacity-70 truncate">{item.description}</p>
                  </div>
                  {activeSection === item.label && <ChevronRight className="w-4 h-4" />}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeSection === "Dados do Negócio" && (
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Dados do Negócio
              </CardTitle>
              <CardDescription>Informações básicas do seu estabelecimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {businessLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : !business ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum estabelecimento encontrado.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="business-name">Nome do Negócio</Label>
                      <Input
                        id="business-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="gradient"
                      onClick={handleSaveBusiness}
                      disabled={updateBusiness.isPending || !name.trim()}
                    >
                      {updateBusiness.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Salvar Alterações
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          )}

          {activeSection === "Horário de Funcionamento" && <BusinessHoursCard />}

          {activeSection === "Serviços e Preços" && (
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-primary" />
                  Serviços e Preços
                </CardTitle>
                <CardDescription>
                  Gerencie serviços e preços na página Serviços.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="gradient" onClick={() => navigate("/servicos")}>
                  Ir para Serviços
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {activeSection === "Equipe" && (
          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Equipe
                </CardTitle>
                <CardDescription>Profissionais cadastrados</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={openCreatePro}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </CardHeader>
            <CardContent>
              {proLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : professionals.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">
                    Nenhum profissional cadastrado ainda
                  </p>
                  <Button variant="outline" size="sm" onClick={openCreatePro}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar primeiro profissional
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {professionals.map((member, index) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${member.color}20` }}
                        >
                          <span className="text-sm font-semibold" style={{ color: member.color }}>
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{member.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.role || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={member.is_active ? "success" : "muted"}>
                            {member.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                          <Switch
                            checked={member.is_active}
                            onCheckedChange={() => toggleActive(member)}
                            disabled={updateProfessional.isPending}
                          />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => openEditPro(member)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {activeSection === "Integrações" && (
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" />
                Integrações
              </CardTitle>
              <CardDescription>
                Integrações em desenvolvimento — em breve você poderá conectar essas ferramentas ao AuraServices.
              </CardDescription>
            </CardHeader>
            <CardContent>
          <div className="mb-6 p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="font-medium text-foreground">Integração com Assistente de IA</p>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Token do seu negócio para conectar assistentes externos (Dify). Mantenha este token em segredo.
            </p>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={tokenLoading ? "Carregando..." : apiToken ?? ""}
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={!apiToken}
                onClick={() => {
                  if (!apiToken) return;
                  navigator.clipboard.writeText(apiToken);
                  toast({ title: "Token copiado" });
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </Button>
            </div>
          </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map((integration, index) => (
                  <div
                    key={integration.name}
                    className="flex items-center justify-between p-4 rounded-lg border border-border animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{integration.icon}</span>
                      <div>
                        <p className="font-medium text-foreground">{integration.name}</p>
                        <p className="text-xs text-muted-foreground">{integration.description}</p>
                      </div>
                    </div>
                    <Badge variant="muted">Em breve</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          )}

          {comingSoonSections.includes(activeSection) && (
            <Card variant="elevated">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <activeItem.icon className="w-5 h-5 text-primary" />
                    {activeItem.label}
                  </CardTitle>
                  <CardDescription>{activeItem.description}</CardDescription>
                </div>
                <Badge variant="muted">Em breve</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Essa área ainda está em desenvolvimento e estará disponível em breve.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ProfessionalDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingPro(null);
        }}
        professional={editingPro}
        onSubmit={handleProSubmit}
        isLoading={createProfessional.isPending || updateProfessional.isPending}
      />
    </AppLayout>
  );
}