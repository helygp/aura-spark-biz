import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Edit,
  Trash2,
  Loader2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/hooks/useBusiness";
import { useClients, Client } from "@/hooks/useClients";
import { ClientDialog, ClientFormValues } from "@/components/clients/ClientDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusColors: Record<string, string> = {
  active: "bg-success",
  inactive: "bg-muted-foreground",
};

interface ClientStats {
  lastVisit: string | null;
  totalVisits: number;
  totalSpent: number;
}

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  const { business, isLoading: businessLoading } = useBusiness();
  const { clients, isLoading, createClient, updateClient, deleteClient } = useClients();

  const { data: appointments = [] } = useQuery({
    queryKey: ["clients-appointments", business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("client_id, status, price, start_time")
        .eq("business_id", business.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!business?.id,
  });

  const statsByClient = useMemo(() => {
    const map = new Map<string, ClientStats>();
    for (const a of appointments as any[]) {
      if (!a.client_id) continue;
      const s = map.get(a.client_id) ?? { lastVisit: null, totalVisits: 0, totalSpent: 0 };
      if (a.status !== "cancelled") {
        if (!s.lastVisit || new Date(a.start_time) > new Date(s.lastVisit)) {
          s.lastVisit = a.start_time;
        }
      }
      if (a.status === "completed") {
        s.totalVisits += 1;
        s.totalSpent += Number(a.price ?? 0);
      }
      map.set(a.client_id, s);
    }
    return map;
  }, [appointments]);

  const getDaysSinceLastVisit = (dateStr: string | null) => {
    if (!dateStr) return Infinity;
    const date = new Date(dateStr);
    const today = new Date();
    return Math.ceil(Math.abs(today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  };

  const enrichedClients = useMemo(
    () =>
      clients.map((c) => {
        const stats = statsByClient.get(c.id) ?? { lastVisit: null, totalVisits: 0, totalSpent: 0 };
        const days = getDaysSinceLastVisit(stats.lastVisit);
        const status: "active" | "inactive" = stats.lastVisit && days <= 45 ? "active" : "inactive";
        return { ...c, ...stats, status, daysSince: days };
      }),
    [clients, statsByClient]
  );

  const filteredClients = enrichedClients.filter((client) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      client.name.toLowerCase().includes(term) ||
      (client.phone ?? "").toLowerCase().includes(term) ||
      (client.email ?? "").toLowerCase().includes(term);
    const matchesStatus = !statusFilter || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const openCreate = () => {
    setEditingClient(null);
    setDialogOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setDialogOpen(true);
  };

  const handleSubmit = (data: ClientFormValues) => {
    const payload = {
      name: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
      notes: data.notes || undefined,
    };
    if (editingClient) {
      updateClient.mutate(
        { id: editingClient.id, ...payload },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditingClient(null);
          },
        }
      );
    } else {
      createClient.mutate(payload, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  const activeCount = enrichedClients.filter((c) => c.status === "active").length;
  const inactiveCount = enrichedClients.filter((c) => c.daysSince > 45 && c.lastVisit).length;

  if (businessLoading || isLoading) {
    return (
      <AppLayout title="Clientes" subtitle="Gerencie sua base de clientes">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Clientes" subtitle={`${clients.length} clientes cadastrados`}>
      <div className="space-y-4 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card variant="elevated">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total de Clientes</p>
              <p className="text-2xl font-bold text-foreground">{clients.length}</p>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Clientes Ativos</p>
              <p className="text-2xl font-bold text-success">{activeCount}</p>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Sem Retorno (+45 dias)</p>
              <p className="text-2xl font-bold text-warning">{inactiveCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone ou e-mail..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-input overflow-hidden">
              <button
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  statusFilter === null ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setStatusFilter(null)}
              >
                Todos
              </button>
              <button
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  statusFilter === "active" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setStatusFilter("active")}
              >
                Ativos
              </button>
              <button
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  statusFilter === "inactive" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setStatusFilter("inactive")}
              >
                Inativos
              </button>
            </div>

            <Button variant="gradient" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </div>

        {/* Clients List */}
        {clients.length === 0 ? (
          <Card variant="elevated">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nenhum cliente cadastrado ainda
              </p>
              <Button className="mt-4" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar primeiro cliente
              </Button>
            </CardContent>
          </Card>
        ) : (
        <Card variant="elevated">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Contato</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Última Visita</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Visitas</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Total Gasto</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client, index) => {
                    const daysSince = client.daysSince;
                    return (
                      <tr 
                        key={client.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors animate-slide-up cursor-pointer"
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() => openEdit(client)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">
                                  {client.name.split(" ").map(n => n[0]).join("")}
                                </span>
                              </div>
                              <span className={cn(
                                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
                                statusColors[client.status]
                              )} />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{client.name}</p>
                              <p className="text-xs text-muted-foreground md:hidden">{client.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <div className="space-y-1">
                            {client.phone && (
                              <p className="text-sm text-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3 text-muted-foreground" />
                                {client.phone}
                              </p>
                            )}
                            {client.email && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {client.email}
                              </p>
                            )}
                            {!client.phone && !client.email && (
                              <p className="text-xs text-muted-foreground">—</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          {client.lastVisit ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-foreground">{formatDate(client.lastVisit)}</span>
                              {daysSince > 45 && (
                                <Badge variant="warning" className="text-[10px]">+{daysSince}d</Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Nunca visitou</span>
                          )}
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          <span className="text-sm text-foreground">{client.totalVisits}</span>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <span className="text-sm font-medium text-foreground">
                            R$ {client.totalSpent.toLocaleString("pt-BR")}
                          </span>
                        </td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(client)} title="Editar">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(client)} title="Remover">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        )}
      </div>

      <ClientDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingClient(null);
        }}
        client={editingClient}
        onSubmit={handleSubmit}
        isLoading={createClient.isPending || updateClient.isPending}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{deleteTarget?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteClient.mutate(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
