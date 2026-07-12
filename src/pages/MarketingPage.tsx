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
import { useState } from "react";
import { useMarketing } from "@/hooks/useMarketing";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MarketingPage() {
  const {
    campaigns,
    waitlist,
    templates,
    isLoading,
    createCampaign,
    createTemplate,
  } = useMarketing();

  const [campaignOpen, setCampaignOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    type: "automatic" as "automatic" | "scheduled",
    message_template: "",
  });
  const [templateForm, setTemplateForm] = useState({
    name: "",
    category: "Operacional",
    content: "",
  });

  const totalSent = campaigns.reduce((s, c) => s + (c.sent_count || 0), 0);
  const totalOpened = campaigns.reduce((s, c) => s + (c.opened_count || 0), 0);
  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const activeCount = campaigns.filter((c) => c.status === "active").length;

  const handleCreateCampaign = async () => {
    if (!campaignForm.name.trim()) return;
    await createCampaign.mutateAsync(campaignForm);
    setCampaignForm({ name: "", type: "automatic", message_template: "" });
    setCampaignOpen(false);
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.name.trim()) return;
    await createTemplate.mutateAsync(templateForm);
    setTemplateForm({ name: "", category: "Operacional", content: "" });
    setTemplateOpen(false);
  };

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
                  <p className="text-2xl font-bold text-foreground mt-1">{totalSent}</p>
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
                  <p className="text-2xl font-bold text-foreground mt-1">{openRate}%</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    {totalOpened} aberturas
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
                  <p className="text-2xl font-bold text-foreground mt-1">{activeCount}</p>
                  <p className="text-xs text-muted-foreground">De {campaigns.length} criadas</p>
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
                <Button variant="gradient" size="sm" onClick={() => setCampaignOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Campanha
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <>
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </>
                ) : campaigns.length === 0 ? (
                  <div className="text-center py-10 text-sm text-muted-foreground">
                    Nenhuma campanha ainda. Clique em <b>Nova Campanha</b> para começar.
                  </div>
                ) : campaigns.map((campaign, index) => {
                  const Icon = campaign.type === "scheduled" ? Gift : Bell;
                  const openPct = campaign.sent_count > 0
                    ? Math.round((campaign.opened_count / campaign.sent_count) * 100) : 0;
                  const clickPct = campaign.sent_count > 0
                    ? Math.round((campaign.clicked_count / campaign.sent_count) * 100) : 0;
                  return (
                  <div 
                    key={campaign.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      campaign.status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="w-5 h-5" />
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
                        <span>{campaign.sent_count} enviadas</span>
                        <span>{openPct}% abertura</span>
                        <span>{clickPct}% cliques</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                  );
                })}
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
                {isLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : waitlist.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Ninguém na lista de espera.
                  </p>
                ) : waitlist.map((person, index) => (
                  <div 
                    key={person.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{person.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {person.preferred_day || "—"} • {person.preferred_time || "—"}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon-sm">
                      <MessageSquare className="w-4 h-4 text-success" />
                    </Button>
                  </div>
                ))}
                {waitlist.length > 0 && (
                  <Button variant="outline" size="sm" className="w-full">
                    Ver todos ({waitlist.length})
                  </Button>
                )}
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
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : templates.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhum template ainda.
                  </p>
                ) : templates.map((template, index) => (
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
                <Button variant="outline" size="sm" className="w-full" onClick={() => setTemplateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* New Campaign Dialog */}
      <Dialog open={campaignOpen} onOpenChange={setCampaignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Campanha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                placeholder="Ex: Promoção de Quinta"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={campaignForm.type}
                onValueChange={(v: "automatic" | "scheduled") =>
                  setCampaignForm({ ...campaignForm, type: v })
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automática</SelectItem>
                  <SelectItem value="scheduled">Agendada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                rows={4}
                value={campaignForm.message_template}
                onChange={(e) =>
                  setCampaignForm({ ...campaignForm, message_template: e.target.value })
                }
                placeholder="Olá {nome}, temos uma novidade para você..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCampaignOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleCreateCampaign}
              disabled={createCampaign.isPending || !campaignForm.name.trim()}
            >
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Template Dialog */}
      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                placeholder="Ex: Confirmação de Agendamento"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={templateForm.category}
                onValueChange={(v) => setTemplateForm({ ...templateForm, category: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Operacional">Operacional</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Relacionamento">Relacionamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Textarea
                rows={4}
                value={templateForm.content}
                onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                placeholder="Olá {nome}, seu horário está confirmado para {data}."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={createTemplate.isPending || !templateForm.name.trim()}
            >
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
