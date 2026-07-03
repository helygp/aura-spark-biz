import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Calendar,
  MessageSquare,
  Edit,
  Trash2,
  Loader2,
  Users,
  Sparkles,
  Phone,
  Mail,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
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

interface ClientStats {
  lastVisit: string | null;
  totalVisits: number;
  totalSpent: number;
  firstVisit: string | null;
  aiVisits: number;
  history: Array<{
    id: string;
    date: string;
    start_time: string;
    service?: string | null;
    source: string;
    price: number;
  }>;
}

const initialsOf = (name: string) =>
  name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { business, isLoading: businessLoading } = useBusiness();
  const { clients, isLoading, createClient, updateClient, deleteClient } = useClients();

  const { data: appointments = [] } = useQuery({
    queryKey: ["clients-appointments-full", business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("id, client_id, status, price, date, start_time, source, service:services(name)")
        .eq("business_id", business.id)
        .order("date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!business?.id,
  });

  const statsByClient = useMemo(() => {
    const map = new Map<string, ClientStats>();
    for (const a of appointments as any[]) {
      if (!a.client_id) continue;
      const s =
        map.get(a.client_id) ??
        {
          lastVisit: null,
          firstVisit: null,
          totalVisits: 0,
          totalSpent: 0,
          aiVisits: 0,
          history: [],
        };
      const ts = `${a.date}T${a.start_time}`;
      if (a.status !== "cancelled") {
        if (!s.lastVisit || new Date(ts) > new Date(s.lastVisit)) s.lastVisit = ts;
        if (!s.firstVisit || new Date(ts) < new Date(s.firstVisit)) s.firstVisit = ts;
      }
      if (a.status === "completed") {
        s.totalVisits += 1;
        s.totalSpent += Number(a.price ?? 0);
      }
      if (a.source === "whatsapp") s.aiVisits += 1;
      s.history.push({
        id: a.id,
        date: a.date,
        start_time: a.start_time,
        service: a.service?.name ?? null,
        source: a.source,
        price: Number(a.price ?? 0),
      });
      map.set(a.client_id, s);
    }
    return map;
  }, [appointments]);

  const daysSince = (d: string | null) => {
    if (!d) return Infinity;
    return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  };

  const enrichedClients = useMemo(
    () =>
      clients.map((c) => {
        const s =
          statsByClient.get(c.id) ??
          {
            lastVisit: null,
            firstVisit: null,
            totalVisits: 0,
            totalSpent: 0,
            aiVisits: 0,
            history: [],
          };
        const days = daysSince(s.lastVisit);
        const status: "active" | "inactive" =
          s.lastVisit && days <= 45 ? "active" : "inactive";
        const isVip = s.totalSpent >= 800 || s.totalVisits >= 10;
        return { ...c, ...s, status, daysSince: days, isVip };
      }),
    [clients, statsByClient],
  );

  const filteredClients = enrichedClients.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(term) ||
      (c.phone ?? "").toLowerCase().includes(term) ||
      (c.email ?? "").toLowerCase().includes(term);
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    if (!selectedId && filteredClients.length > 0) {
      setSelectedId(filteredClients[0].id);
    }
  }, [filteredClients, selectedId]);

  const selected = enrichedClients.find((c) => c.id === selectedId) || null;

  const relationshipLabel = (firstVisit: string | null) => {
    if (!firstVisit) return "Cliente novo";
    const months = Math.floor(daysSince(firstVisit) / 30);
    if (months < 1) return "Cliente novo";
    if (months < 12) return `Cliente há ${months} mes${months > 1 ? "es" : ""}`;
    const y = Math.floor(months / 12);
    return `Cliente há ${y} ano${y > 1 ? "s" : ""}`;
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
        },
      );
    } else {
      createClient.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  if (businessLoading || isLoading) {
    return (
      <AppLayout title="Clientes" subtitle="Gerencie sua base de clientes">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const openWhatsApp = (phone: string | null) => {
    if (!phone) return;
    const digits = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${digits}`, "_blank");
  };

  return (
    <AppLayout title="Clientes" subtitle={`${clients.length} clientes cadastrados`}>
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 animate-fade-in">
        {/* Left: list */}
        <div className="rounded-[20px] bg-card border border-border flex flex-col overflow-hidden max-h-[calc(100vh-160px)]">
          <div className="p-4 border-b border-border space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tx4" strokeWidth={1.8} />
              <Input
                placeholder="Buscar cliente..."
                className="pl-9 h-10 rounded-[12px] bg-panel2 border-line2 text-[13px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex rounded-full bg-panel2 p-1 text-[12px]">
                {(["all", "active", "inactive"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "px-3 py-1 rounded-full font-medium transition-colors",
                      statusFilter === s ? "bg-tx1 text-background" : "text-tx3 hover:text-tx1",
                    )}
                  >
                    {s === "all" ? "Todos" : s === "active" ? "Ativos" : "Inativos"}
                  </button>
                ))}
              </div>
              <Button
                size="icon-sm"
                className="rounded-[10px] bg-tx1 hover:bg-tx1/90 text-background h-9 w-9"
                onClick={() => {
                  setEditingClient(null);
                  setDialogOpen(true);
                }}
                title="Novo cliente"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <Users className="w-10 h-10 text-tx4 mb-3" strokeWidth={1.5} />
                <p className="text-[13px] text-tx3">Nenhum cliente encontrado</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 rounded-[10px]"
                  onClick={() => {
                    setEditingClient(null);
                    setDialogOpen(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Novo cliente
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-line2">
                {filteredClients.map((c) => {
                  const isActive = selectedId === c.id;
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => setSelectedId(c.id)}
                        className={cn(
                          "w-full px-4 py-3 flex items-center gap-3 text-left transition-colors",
                          isActive ? "bg-panel2" : "hover:bg-panel2/50",
                        )}
                      >
                        <div className="w-10 h-10 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center font-semibold text-[12px]">
                          {initialsOf(c.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[13.5px] font-medium text-tx1 truncate">
                              {c.name}
                            </p>
                            {c.isVip && (
                              <span className="text-[9px] font-semibold uppercase tracking-wide rounded-full bg-warning/15 text-warning px-1.5 py-0.5">
                                VIP
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-tx4 truncate">
                            {c.lastVisit
                              ? `Última: há ${c.daysSince}d`
                              : "Nunca visitou"}
                          </p>
                        </div>
                        <div className="font-display text-[14px] text-tx1">
                          R$ {c.totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right: detail */}
        <div>
          {!selected ? (
            <div className="rounded-[20px] bg-card border border-border p-12 flex flex-col items-center justify-center text-center">
              <Users className="w-12 h-12 text-tx4 mb-3" strokeWidth={1.5} />
              <p className="text-tx3">Selecione um cliente para ver os detalhes</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Header card */}
              <div className="rounded-[22px] bg-card border border-border p-6">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-[14px] bg-primary/10 text-primary flex items-center justify-center font-semibold text-lg">
                    {initialsOf(selected.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display text-[24px] text-tx1">{selected.name}</h2>
                      {selected.isVip && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide rounded-full bg-warning/15 text-warning px-2 py-0.5">
                          VIP
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-tx3 mt-1">
                      {relationshipLabel(selected.firstVisit)}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-[12px] text-tx3">
                      {selected.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3" strokeWidth={1.8} />
                          {selected.phone}
                        </span>
                      )}
                      {selected.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3 h-3" strokeWidth={1.8} />
                          {selected.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => openWhatsApp(selected.phone)}
                      disabled={!selected.phone}
                      className="rounded-[10px] bg-whatsapp hover:bg-whatsapp/90 text-white h-9"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-[10px] border-border h-9"
                      onClick={() => (window.location.href = "/agenda")}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Agendar
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                  <MiniStat label="Visitas" value={String(selected.totalVisits)} />
                  <MiniStat
                    label="Total gasto"
                    value={`R$ ${selected.totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`}
                  />
                  <MiniStat
                    label="Última visita"
                    value={
                      selected.lastVisit
                        ? new Date(selected.lastVisit).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                          })
                        : "—"
                    }
                  />
                  <MiniStat
                    label="Ticket médio"
                    value={
                      selected.totalVisits > 0
                        ? `R$ ${(selected.totalSpent / selected.totalVisits).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`
                        : "—"
                    }
                  />
                </div>

                <div className="flex justify-end gap-1 mt-4 pt-4 border-t border-line2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingClient(selected);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit className="w-3.5 h-3.5 mr-1.5" /> Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(selected)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remover
                  </Button>
                </div>
              </div>

              {/* Retention nudge */}
              {selected.status === "inactive" && selected.lastVisit && (
                <div className="rounded-[22px] bg-hero text-hero-foreground p-5 relative overflow-hidden">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-[10px] bg-primary/25 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-medium">
                        Cliente sem retorno há {selected.daysSince} dias
                      </p>
                      <p className="text-[12px] text-hero-foreground/70 mt-1">
                        Envie uma mensagem personalizada pelo WhatsApp para trazer{" "}
                        {selected.name.split(" ")[0]} de volta.
                      </p>
                    </div>
                    <Button
                      onClick={() => openWhatsApp(selected.phone)}
                      disabled={!selected.phone}
                      className="rounded-[10px] bg-primary hover:bg-primary-hover text-primary-foreground h-9"
                    >
                      Enviar
                    </Button>
                  </div>
                </div>
              )}

              {/* History */}
              <div className="rounded-[22px] bg-card border border-border p-6">
                <h3 className="font-display text-[18px] text-tx1 mb-4">Histórico de visitas</h3>
                {selected.history.length === 0 ? (
                  <p className="text-[13px] text-tx4 py-4">Nenhuma visita registrada ainda.</p>
                ) : (
                  <ul className="space-y-2">
                    {selected.history.slice(0, 10).map((h) => {
                      const isAi = h.source === "whatsapp";
                      return (
                        <li
                          key={h.id}
                          className="flex items-center gap-3 p-3 rounded-[12px] hover:bg-panel2 transition-colors"
                        >
                          <span
                            className={cn(
                              "w-2.5 h-2.5 rounded-full flex-shrink-0",
                              isAi ? "bg-primary" : "bg-border",
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-display text-[14px] text-tx1">
                                {new Date(h.date).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "short",
                                })}
                              </span>
                              <span className="text-[12px] text-tx3">
                                {h.start_time.slice(0, 5)}
                              </span>
                              {isAi && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-whatsapp/15 text-whatsapp px-1.5 py-0.5 text-[10px] font-semibold">
                                  <MessageSquare className="w-2.5 h-2.5" />
                                  via IA
                                </span>
                              )}
                            </div>
                            <p className="text-[12px] text-tx3 truncate">
                              {h.service || "Serviço não especificado"}
                            </p>
                          </div>
                          {h.price > 0 && (
                            <span className="font-display text-[14px] text-tx1">
                              R$ {h.price.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
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
                  deleteClient.mutate(deleteTarget.id, {
                    onSuccess: () => {
                      if (selectedId === deleteTarget.id) setSelectedId(null);
                    },
                  });
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] bg-panel2 p-3">
      <p className="text-[10px] uppercase tracking-[0.12em] text-tx4">{label}</p>
      <p className="font-display text-[20px] text-tx1 mt-1 leading-none">{value}</p>
    </div>
  );
}